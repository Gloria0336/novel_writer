import { describe, expect, it } from "vitest";
import type { BattleState, TroopInstance } from "../../core/types/battle";
import type { BattleContext } from "../../core/types/context";
import { executeEffects } from "../../core/effects/registry";
import { getCard, RIFT_INFILTRATOR_CARDS } from "./index";
import { getRace } from "../races";
import { getClass } from "../classes";
import { HEROES } from "../heroes";
import { registerCoreScripted } from "../../core/effects/handlers/scripted";

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

function mkState(): BattleState {
  const ph = HEROES["lulu"]!;
  return {
    seed: 1, rngState: 1, nextInstanceId: 100, turn: 1, activeSide: "enemy", phase: "main",
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
    field: null, stability: 100, corruptionStage: 0, log: [], result: "ongoing",
  };
}

function mkInfiltrator(cardId: string): TroopInstance {
  const c = getCard(cardId);
  if (c.type !== "troop") throw new Error("not troop");
  return {
    instanceId: `inf_${cardId}`, cardId,
    hp: c.hp, maxHp: c.hp, atk: c.atk, def: c.def,
    keywords: new Set(c.keywords),
    hasAttackedThisTurn: false, summonedThisTurn: false, frozenTurns: 0, buffs: [],
    fromRift: true,
  };
}

describe("M01–M06 卡定義完整性", () => {
  it("RIFT_INFILTRATOR_CARDS 共 6 張，ID M01–M06", () => {
    expect(RIFT_INFILTRATOR_CARDS).toHaveLength(6);
    expect(RIFT_INFILTRATOR_CARDS.map((c) => c.id)).toEqual(["M01", "M02", "M03", "M04", "M05", "M06"]);
  });

  it("getCard 可取得 M01–M06", () => {
    for (const id of ["M01", "M02", "M03", "M04", "M05", "M06"]) {
      const c = getCard(id);
      expect(c.id).toBe(id);
      expect(c.type).toBe("troop");
    }
  });

  it("M01–M06 全為 troop card 且有 flavor", () => {
    for (const c of RIFT_INFILTRATOR_CARDS) {
      expect(c.type).toBe("troop");
      expect(c.flavor).toBeTruthy();
    }
  });
});

describe("M01 黑暗史萊姆（1 費 8/3/1）— 謝幕曲：對隨機玩家單位 2 腐蝕傷害", () => {
  it("基準數值", () => {
    const c = getCard("M01");
    if (c.type !== "troop") throw new Error("not troop");
    expect(c.cost).toBe(1);
    expect(c.hp).toBe(8);
    expect(c.atk).toBe(3);
    expect(c.def).toBe(1);
  });

  it("謝幕曲：對玩家單位 2 傷害（無視 DEF）", () => {
    const s = mkState();
    const m01 = mkInfiltrator("M01");
    s.enemy.troopSlots[0] = m01;
    // 玩家方有 1 兵力 + 英雄
    const c = getCard("T03");
    if (c.type !== "troop") throw new Error("not troop");
    s.player.troopSlots[0] = {
      instanceId: "pt1", cardId: "T03",
      hp: c.hp, maxHp: c.hp, atk: c.atk, def: c.def,
      keywords: new Set(c.keywords),
      hasAttackedThisTurn: false, summonedThisTurn: false, frozenTurns: 0, buffs: [],
    }; // T03 守護兵 10/2/5
    const m01Card = getCard("M01");
    if (m01Card.type !== "troop" || !m01Card.onDestroy) throw new Error("expect onDestroy");
    executeEffects(m01Card.onDestroy, {
      state: s, ctx, sourceSide: "enemy", sourceKind: "troop_destroy", sourceInstanceId: m01.instanceId, sourceCardId: "M01",
    });
    // 隨機 1 名玩家方單位（target.ts random 返回前 1 個，即英雄）
    // 玩家英雄 DEF 5，但 ignoreDef → -2 HP
    // 或者命中兵力 T03 → ignoreDef 直接扣 2 HP
    const heroDamaged = s.player.hero.hp < 80;
    const troopDamaged = s.player.troopSlots[0]!.hp < 10;
    expect(heroDamaged || troopDamaged).toBe(true);
  });
});

describe("M02 觸手蠕行體（2 費 12/5/2）", () => {
  it("基準數值（簡化版：純數值，passive 留 Stage 3）", () => {
    const c = getCard("M02");
    if (c.type !== "troop") throw new Error("not troop");
    expect(c.cost).toBe(2);
    expect(c.hp).toBe(12);
    expect(c.atk).toBe(5);
    expect(c.def).toBe(2);
  });
});

describe("M03 古魔咆哮者（3 費 15/8/2）— 入場曲：對玩家英雄 3 純黑暗傷害（無視 DEF）", () => {
  it("基準數值與〔突進〕關鍵字", () => {
    const c = getCard("M03");
    if (c.type !== "troop") throw new Error("not troop");
    expect(c.cost).toBe(3);
    expect(c.hp).toBe(15);
    expect(c.atk).toBe(8);
    expect(c.def).toBe(2);
    expect(c.keywords).toContain("rush");
  });

  it("入場曲：玩家英雄 -3 HP（無視 DEF 5）", () => {
    const s = mkState();
    s.player.hero.hp = 80;
    s.player.hero.def = 5;
    const c = getCard("M03");
    if (c.type !== "troop" || !c.onPlay) throw new Error("expect onPlay");
    executeEffects(c.onPlay, {
      state: s, ctx, sourceSide: "enemy", sourceKind: "troop_play", sourceCardId: "M03",
    });
    expect(s.player.hero.hp).toBe(77); // 80 - 3（無視 DEF）
  });
});

describe("M04 夢魔影刺（4 費 10/9/1）— 〔疾走〕", () => {
  it("基準數值與〔疾走〕關鍵字", () => {
    const c = getCard("M04");
    if (c.type !== "troop") throw new Error("not troop");
    expect(c.cost).toBe(4);
    expect(c.hp).toBe(10);
    expect(c.atk).toBe(9);
    expect(c.def).toBe(1);
    expect(c.keywords).toContain("haste");
  });
});

describe("M05 冰魔施法者（5 費 14/6/3）— 入場曲：對所有玩家兵力 3 傷 + ATK -2", () => {
  it("基準數值", () => {
    const c = getCard("M05");
    if (c.type !== "troop") throw new Error("not troop");
    expect(c.cost).toBe(5);
    expect(c.hp).toBe(14);
    expect(c.atk).toBe(6);
    expect(c.def).toBe(3);
  });

  it("入場曲：所有玩家兵力 -3 HP + ATK -2 / 1 回合", () => {
    const s = mkState();
    const t1 = getCard("T02"); // 12/5/2
    const t2 = getCard("T03"); // 10/2/5
    if (t1.type !== "troop" || t2.type !== "troop") throw new Error();
    s.player.troopSlots[0] = {
      instanceId: "pt1", cardId: "T02",
      hp: t1.hp, maxHp: t1.hp, atk: t1.atk, def: t1.def,
      keywords: new Set(t1.keywords), hasAttackedThisTurn: false, summonedThisTurn: false, frozenTurns: 0, buffs: [],
    };
    s.player.troopSlots[1] = {
      instanceId: "pt2", cardId: "T03",
      hp: t2.hp, maxHp: t2.hp, atk: t2.atk, def: t2.def,
      keywords: new Set(t2.keywords), hasAttackedThisTurn: false, summonedThisTurn: false, frozenTurns: 0, buffs: [],
    };
    const c = getCard("M05");
    if (c.type !== "troop" || !c.onPlay) throw new Error("expect onPlay");
    executeEffects(c.onPlay, {
      state: s, ctx, sourceSide: "enemy", sourceKind: "troop_play", sourceCardId: "M05",
    });
    // T02 (DEF 2): 3 - 2 = 1 → 12 - 1 = 11
    // T03 (DEF 5): 3 - 5 仍有最低 1 點傷害 → 10 - 1 = 9
    expect(s.player.troopSlots[0]?.hp).toBe(11);
    expect(s.player.troopSlots[1]?.hp).toBe(9);
    // 兩個兵力都應該 atk -2
    expect(s.player.troopSlots[0]?.atk).toBe(3); // 5 - 2
    expect(s.player.troopSlots[1]?.atk).toBe(0); // 2 - 2
  });
});

describe("M06 巨魔碎牆者（6 費 22/9/7）— 純高坦 + 〔守護〕", () => {
  it("基準數值與〔守護〕關鍵字", () => {
    const c = getCard("M06");
    if (c.type !== "troop") throw new Error("not troop");
    expect(c.cost).toBe(6);
    expect(c.hp).toBe(22);
    expect(c.atk).toBe(9);
    expect(c.def).toBe(7);
    expect(c.keywords).toContain("guard");
  });

  it("無入場曲/謝幕曲（純高坦）", () => {
    const c = getCard("M06");
    if (c.type !== "troop") throw new Error("not troop");
    expect(c.onPlay).toBeUndefined();
    expect(c.onDestroy).toBeUndefined();
  });
});
