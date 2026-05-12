import { beforeEach, describe, expect, it } from "vitest";
import type { BattleState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import { executeEffects, registerScripted } from "./registry";
import { ALL_CARDS, GENERIC_CARDS, getCard } from "../../data/cards";
import { getRace } from "../../data/races";
import { getClass } from "../../data/classes";
import { HEROES } from "../../data/heroes";
import { registerCoreScripted } from "./handlers/scripted";

registerCoreScripted();

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

function mkState(playerHeroId = "commander_legion", enemyHeroId = "commander_legion"): BattleState {
  const ph = HEROES[playerHeroId]!;
  const eh = HEROES[enemyHeroId]!;
  return {
    seed: 1, rngState: 1, nextInstanceId: 100, turn: 1, activeSide: "player", phase: "main",
    player: {
      hero: { defId: ph.id, hp: 80, maxHp: 80, atk: 6, def: 5, cmd: 9, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
      manaCurrent: 10, manaCap: 10, manaCapAbsolute: 10, tempMana: 0, deck: [], hand: [], graveyard: [],
      troopSlots: [null, null, null, null, null], spellsCastThisTurn: 0, spellsCastThisGame: 0,
    },
    enemy: {
      hero: { defId: eh.id, hp: 80, maxHp: 80, atk: 6, def: 0, cmd: 9, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
      manaCurrent: 0, manaCap: 0, manaCapAbsolute: 10, tempMana: 0, deck: [], hand: [], graveyard: [],
      troopSlots: [null, null, null, null, null], spellsCastThisTurn: 0, spellsCastThisGame: 0,
    },
    field: null, stability: 100, corruptionStage: 0, log: [], result: "ongoing",
  };
}

describe("通用卡資料完整性", () => {
  it("通用卡共 94 張", () => {
    expect(GENERIC_CARDS).toHaveLength(94);
  });
  it("通用卡分類正確：14 兵力 + 10 行動 + 14 法術 + 48 裝備 + 8 場地", () => {
    const byType = GENERIC_CARDS.reduce<Record<string, number>>((acc, c) => {
      acc[c.type] = (acc[c.type] ?? 0) + 1;
      return acc;
    }, {});
    expect(byType.troop).toBe(14);
    expect(byType.action).toBe(10);
    expect(byType.spell).toBe(14);
    expect(byType.equipment).toBe(48);
    expect(byType.field).toBe(8);
  });
  it("總卡池 = 通用 94 + 6 種族×10 + 中立傳說 6 = 160 張", () => {
    expect(ALL_CARDS).toHaveLength(160);
  });
  it("每張卡 id 唯一", () => {
    const ids = ALL_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("S07 烈焰風暴 — 對所有敵兵造 10 傷害", () => {
  it("3 個敵兵各受 10 傷", () => {
    const s = mkState();
    s.enemy.troopSlots[0] = mkTroop("T01"); // 8/3/1
    s.enemy.troopSlots[1] = mkTroop("T02"); // 12/5/2
    s.enemy.troopSlots[2] = mkTroop("T03"); // 10/2/5

    executeEffects(getCard("S07").type === "spell" ? (getCard("S07") as { effects: import("../types/effect").Effect[] }).effects : [], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S07",
    });

    // T01: 10 - DEF 1 = 9 傷 → hp 8 - 9 = 0（死）
    expect(s.enemy.troopSlots[0]).toBeNull();
    // T02: 10 - 2 = 8 → 12 - 8 = 4
    expect(s.enemy.troopSlots[1]?.hp).toBe(4);
    // T03: 10 - 5 = 5 → 10 - 5 = 5
    expect(s.enemy.troopSlots[2]?.hp).toBe(5);
  });
});

describe("T06 傳令兵 入場曲：抽 1 張", () => {
  it("入場曲時手牌增加 1 張", () => {
    const s = mkState();
    // 牌庫塞 2 張
    s.player.deck = [{ instanceId: "d1", cardId: "T01" }, { instanceId: "d2", cardId: "T02" }];
    const card = getCard("T06");
    if (card.type !== "troop") throw new Error("expect troop");
    executeEffects(card.onPlay ?? [], { state: s, ctx, sourceSide: "player", sourceKind: "troop_play", sourceCardId: "T06" });
    expect(s.player.hand).toHaveLength(1);
  });
});

describe("T11 戰地牧師 入場曲：恢復英雄 8 HP", () => {
  it("英雄 HP +8（不超過 max）", () => {
    const s = mkState();
    s.player.hero.hp = 50;
    const card = getCard("T11");
    if (card.type !== "troop") throw new Error("expect troop");
    executeEffects(card.onPlay ?? [], { state: s, ctx, sourceSide: "player", sourceKind: "troop_play", sourceCardId: "T11" });
    expect(s.player.hero.hp).toBe(58);
  });
});

describe("S03 治癒之風 — 神官祝福 +50%", () => {
  it("一般法師恢復 10 HP", () => {
    const s = mkState("archmage_grand", "commander_legion");
    s.player.hero.defId = "archmage_grand";
    s.player.hero.hp = 50;
    s.player.hero.maxHp = 100;
    const c = getCard("S03");
    if (c.type !== "spell") throw new Error("expect spell");
    // 取代效果中的 single target 為英雄自身
    const eff = c.effects.map((e) => ({ ...(e as object), target: { kind: "self" as const } }));
    executeEffects(eff as import("../types/effect").Effect[], { state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S03" });
    expect(s.player.hero.hp).toBe(60);
  });
});

describe("守護優先制 — S07 群體不受守護限制（ignoreGuard 在卡定義由群體效果繞過）", () => {
  it("烈焰風暴透過 all target，不受守護優先制阻擋", () => {
    const s = mkState();
    s.enemy.troopSlots[0] = mkTroop("T03"); // 守護
    s.enemy.troopSlots[1] = mkTroop("T01"); // 普通
    const c = getCard("S07");
    if (c.type !== "spell") throw new Error("expect spell");
    executeEffects(c.effects, { state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S07" });
    expect(s.enemy.troopSlots[0]?.hp ?? 0).toBe(5);
    expect(s.enemy.troopSlots[1]).toBeNull();
  });
});

describe("S12 毀滅射線 — 30 固定傷害（無視 DEF）", () => {
  it("敵方英雄 -30 HP（即使 DEF 5）", () => {
    const s = mkState();
    s.enemy.hero.def = 5;
    const c = getCard("S12");
    if (c.type !== "spell") throw new Error("expect spell");
    const eff = c.effects.map((e) => ({ ...(e as object), target: { kind: "enemyHero" as const } })) as import("../types/effect").Effect[];
    executeEffects(eff, { state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S12" });
    expect(s.enemy.hero.hp).toBe(50);
  });
});

describe("S08 次元修補 — 穩定度 +15", () => {
  it("穩定度從 80 變 95（封頂 100）", () => {
    const s = mkState();
    s.stability = 80;
    s.corruptionStage = 0;
    const c = getCard("S08");
    if (c.type !== "spell") throw new Error("expect spell");
    executeEffects(c.effects, { state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S08" });
    expect(s.stability).toBe(95);
  });
});

describe("T14 傳奇傭兵團 — 入場召喚 2 個傭兵", () => {
  it("召喚 2 個 T02 到場上", () => {
    const s = mkState();
    const c = getCard("T14");
    if (c.type !== "troop") throw new Error("expect troop");
    executeEffects(c.onPlay ?? [], { state: s, ctx, sourceSide: "player", sourceKind: "troop_play", sourceCardId: "T14" });
    const summoned = s.player.troopSlots.filter((t) => t !== null);
    expect(summoned).toHaveLength(2);
    expect(summoned.every((t) => t!.cardId === "T02")).toBe(true);
  });
});

describe("S06 冰封術 — 凍結敵兵 2 回合", () => {
  it("frozenTurns = 2", () => {
    const s = mkState();
    s.enemy.troopSlots[0] = mkTroop("T01");
    const c = getCard("S06");
    if (c.type !== "spell") throw new Error("expect spell");
    const eff = c.effects.map((e) => ({ ...(e as object), target: { kind: "single" as const, filter: { entity: "troop", side: "enemy" }, pickedInstanceId: s.enemy.troopSlots[0]!.instanceId } })) as import("../types/effect").Effect[];
    executeEffects(eff, { state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S06" });
    expect(s.enemy.troopSlots[0]?.frozenTurns).toBe(2);
  });
});

describe("鬥志累積規則", () => {
  it("行動命中 +10 鬥志", () => {
    const s = mkState();
    s.enemy.troopSlots[0] = mkTroop("T01");
    s.player.hero.morale = 0;
    // 模擬行動造傷
    executeEffects([{ kind: "damage", target: { kind: "single", filter: {}, pickedInstanceId: s.enemy.troopSlots[0]!.instanceId }, amount: { kind: "const", value: 5 } }], {
      state: s, ctx, sourceSide: "player", sourceKind: "action", sourceCardId: "test",
    });
    expect(s.player.hero.morale).toBeGreaterThanOrEqual(10);
  });

  it("擊殺敵兵 +15 鬥志", () => {
    const s = mkState();
    s.enemy.troopSlots[0] = mkTroop("T01"); // hp 8
    s.player.hero.morale = 0;
    executeEffects([{ kind: "damage", target: { kind: "single", filter: {}, pickedInstanceId: s.enemy.troopSlots[0]!.instanceId }, amount: { kind: "const", value: 100 } }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "test",
    });
    // 法術不算「行動」，但擊殺仍給 +15
    expect(s.player.hero.morale).toBeGreaterThanOrEqual(15);
  });
});
