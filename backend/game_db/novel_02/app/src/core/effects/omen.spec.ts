import { describe, expect, it } from "vitest";
import type { BattleState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import { executeEffects, registerScripted } from "./registry";
import { getCard } from "../../data/cards";
import { getRace } from "../../data/races";
import { getClass } from "../../data/classes";
import { HEROES } from "../../data/heroes";
import { registerCoreScripted } from "./handlers/scripted";
import { registerRaceCardScripted } from "./handlers/raceCards";
import { startTurnFor } from "../turn/phases";
import { applyAction } from "../turn/reducer";
import { getEffectiveCardCost } from "../resource/gaugeScalingBuff";
import { applyOmenOnEnter } from "./omenHooks";

registerCoreScripted();
registerRaceCardScripted();

const ctx: BattleContext = {
  getCard,
  getHero: (id) => {
    const h = HEROES[id];
    if (!h) throw new Error(`unknown hero: ${id}`);
    return h;
  },
  getRace: (id) => getRace(id as Parameters<typeof getRace>[0]),
  getClass: (id) => getClass(id as Parameters<typeof getClass>[0]),
};

function mkTroop(cardId: string, instanceId = `t_${Math.random()}`): TroopInstance {
  const c = getCard(cardId);
  if (c.type !== "troop") throw new Error("not troop");
  return {
    instanceId, cardId, hp: c.hp, maxHp: c.hp, atk: c.atk, def: c.def,
    keywords: new Set(c.keywords), hasAttackedThisTurn: false, summonedThisTurn: false, frozenTurns: 0, buffs: [],
  };
}

function mkState(): BattleState {
  const ph = HEROES["lulu"]!;
  return {
    seed: 1, rngState: 1, nextInstanceId: 100, turn: 1, activeSide: "player", phase: "main",
    player: {
      hero: { defId: ph.id, hp: 80, maxHp: 80, atk: 6, def: 5, cmd: 9, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
      manaCurrent: 10, manaCap: 10, manaCapAbsolute: 10, tempMana: 0, deck: [], hand: [], graveyard: [],
      troopSlots: [null, null, null, null, null], spellsCastThisTurn: 0, spellsCastThisGame: 0,
    },
    enemy: {
      hero: { defId: ph.id, hp: 80, maxHp: 80, atk: 6, def: 0, cmd: 9, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
      manaCurrent: 0, manaCap: 0, manaCapAbsolute: 10, tempMana: 0, deck: [], hand: [], graveyard: [],
      troopSlots: [null, null, null, null, null], spellsCastThisTurn: 0, spellsCastThisGame: 0,
    },
    field: { player: null, enemy: null }, omen: null, stability: 100, corruptionStage: 0, log: [], result: "ongoing",
  };
}

describe("v3.4 天象 × 場地互動", () => {
  it("雙月同圓：F_c_05 火傷 ×1.5 取整，且場地不可被 destroyField 摧毀", () => {
    const s = mkState();
    s.field.player = { cardId: "F_c_05" };
    s.player.troopSlots[0] = mkTroop("T_c_01", "ally");
    s.omen = { id: "twin_moons", remainingTurns: 5 };

    startTurnFor(s, "player", ctx);

    // 原本 F_c_05 火傷 3，×1.5 取 4，-1 def → 3 dmg。T_c_01 hp 8 - 3 = 5
    expect(s.player.troopSlots[0]?.hp).toBe(5);

    // destroyField 在保護期被擋
    executeEffects([{ kind: "destroyField", side: "self" }], { state: s, ctx, sourceSide: "player", sourceKind: "spell" });
    expect(s.field.player?.cardId).toBe("F_c_05");
  });

  it("副月凌主月：法術 cost +1、場地 buff +1", () => {
    const s = mkState();
    s.omen = { id: "minor_eclipse", remainingTurns: 7 };

    // 法術 cost +1
    const spell = getCard("S_c_01"); // 任一法術
    const baseCost = getEffectiveCardCost(s, ctx, "player", spell);
    s.omen = null;
    const noOmenCost = getEffectiveCardCost(s, ctx, "player", spell);
    expect(baseCost).toBe(noOmenCost + 1);

    // 場地 buff +1：F_c_01 平原原本 ATK+1，受副月凌主月 → +2
    s.omen = { id: "minor_eclipse", remainingTurns: 7 };
    s.player.troopSlots[0] = mkTroop("T_c_01", "ally");
    executeEffects(getCard("F_c_01").type === "field" ? (getCard("F_c_01") as { effects: import("../types/effect").Effect[] }).effects : [], {
      state: s, ctx, sourceSide: "player", sourceKind: "field", sourceCardId: "F_c_01",
    });
    expect(s.player.troopSlots[0]?.atk).toBe(3 + 2); // T_c_01 base atk 3 + (1+1)
  });

  it("碎片雨：進場時摧毀既有場地、持續期間禁止放置", () => {
    const s = mkState();
    s.field.player = { cardId: "F_c_01" };
    s.field.enemy = { cardId: "F_s_01" };
    s.omen = { id: "shard_rain", remainingTurns: 5 };

    // 模擬 onEnter
    applyOmenOnEnter(s);

    // 至少一方場地被摧毀
    const destroyedCount = (s.field.player ? 0 : 1) + (s.field.enemy ? 0 : 1);
    expect(destroyedCount).toBeGreaterThanOrEqual(1);

    // 放置新場地被擋（透過 reducer.playField → canPlayField）
    s.player.hand = [{ instanceId: "f1", cardId: "F_c_02" }];
    const result = applyAction(s, { type: "PLAY_FIELD", handIndex: 0 }, ctx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("shard rain");
  });

  it("日蝕：場地傷害類失效；buff 翻倍", () => {
    const s = mkState();
    s.field.player = { cardId: "F_c_05" };
    s.player.troopSlots[0] = mkTroop("T_c_01", "ally");
    s.omen = { id: "solar_eclipse", remainingTurns: 10 };

    startTurnFor(s, "player", ctx);

    // F_c_05 火傷被 omen 改成 0 → 兵力不受傷
    expect(s.player.troopSlots[0]?.hp).toBe(8);

    // F_c_01 buff 翻倍：ATK +1 → +2
    s.omen = { id: "solar_eclipse", remainingTurns: 10 };
    s.player.troopSlots[1] = mkTroop("T_c_01", "ally2");
    executeEffects(getCard("F_c_01").type === "field" ? (getCard("F_c_01") as { effects: import("../types/effect").Effect[] }).effects : [], {
      state: s, ctx, sourceSide: "player", sourceKind: "field", sourceCardId: "F_c_01",
    });
    expect(s.player.troopSlots[1]?.atk).toBe(3 + 2); // T_c_01 base atk 3 + (1×2)
  });

  it("流星墜：remainingTurns=1 必中，摧毀對方場地並對對方英雄 8 傷", () => {
    const s = mkState();
    s.field.enemy = { cardId: "F_c_01" };
    s.omen = { id: "meteor", remainingTurns: 1 };
    const beforeHp = s.enemy.hero.hp;

    // 玩家回合開始時觸發
    startTurnFor(s, "player", ctx);

    expect(s.field.enemy).toBeNull();
    expect(s.enemy.hero.hp).toBe(beforeHp - 8);
    expect(s.omen).toBeNull();
  });

  it("靈潮湧動：場地 cost = 0；場地回合開始效果觸發兩次", () => {
    const s = mkState();
    s.omen = { id: "spirit_surge", remainingTurns: 4 };

    // 場地 cost = 0
    const fieldCard = getCard("F_c_04"); // cost 3
    expect(getEffectiveCardCost(s, ctx, "player", fieldCard)).toBe(0);

    // 觸發兩次：F_c_04 +1 臨時魔力 → 應該 +2
    s.field.player = { cardId: "F_c_04" };
    expect(s.player.tempMana).toBe(0);
    startTurnFor(s, "player", ctx);
    expect(s.player.tempMana).toBe(2);
  });
});
