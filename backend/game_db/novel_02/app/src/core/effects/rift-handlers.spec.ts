import { describe, expect, it } from "vitest";
import type { BattleState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import { executeEffects } from "./registry";
import { openRiftIfNeeded, triggerInfiltration } from "../resource/rift";
import { createInitialRift } from "../types/rift";
import { getCard } from "../../data/cards";
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

function mkState(opts: { turn?: number; stability?: number } = {}): BattleState {
  const ph = HEROES["lulu"]!;
  return {
    seed: 1, rngState: 1, nextInstanceId: 100,
    turn: opts.turn ?? 1, activeSide: "player", phase: "main",
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
    field: null, stability: opts.stability ?? 100, corruptionStage: 0, log: [], result: "ongoing",
  };
}

describe("S15 RIFT_CALL — 免費部署手牌兵力到裂縫位", () => {
  it("Open 時：手牌兵力免費部署、套 ATK ×2 DEF +5、s15UsesPlayer++", () => {
    const s = mkState({ stability: 40 });
    openRiftIfNeeded(s);
    expect(s.rift?.holder).toBe("open");
    // 在手牌放 T13 精英禁衛（5 費 22/8/5）
    s.player.hand = [{ instanceId: "hand_t13", cardId: "T13" }];
    executeEffects([{ kind: "scripted", tag: "RIFT_CALL", payload: { handCardInstanceId: "hand_t13" } }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S15",
    });
    expect(s.rift?.holder).toBe("player");
    expect(s.rift?.occupant).not.toBeNull();
    expect(s.rift?.occupant?.cardId).toBe("T13");
    expect(s.rift?.occupant?.atk).toBe(16); // 8 × 2
    expect(s.rift?.occupant?.def).toBe(10); // 5 + 5
    expect(s.rift?.s15UsesPlayer).toBe(1);
    // 手牌移除、棄牌堆收回
    expect(s.player.hand).toHaveLength(0);
    expect(s.player.graveyard).toHaveLength(1);
  });

  it("非 Open 時 noop（不錯誤但無效果）", () => {
    const s = mkState({ stability: 40 });
    openRiftIfNeeded(s);
    triggerInfiltration(s, ctx); // → enemy 佔據
    const beforeOcc = s.rift?.occupant;
    s.player.hand = [{ instanceId: "hand_t02", cardId: "T02" }];
    executeEffects([{ kind: "scripted", tag: "RIFT_CALL", payload: { handCardInstanceId: "hand_t02" } }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S15",
    });
    expect(s.rift?.occupant).toBe(beforeOcc);
    expect(s.rift?.holder).toBe("enemy");
    expect(s.rift?.s15UsesPlayer).toBe(0);
  });

  it("手牌目標 instanceId 找不到 → noop", () => {
    const s = mkState({ stability: 40 });
    openRiftIfNeeded(s);
    s.player.hand = []; // 空
    executeEffects([{ kind: "scripted", tag: "RIFT_CALL", payload: { handCardInstanceId: "nonexistent" } }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S15",
    });
    expect(s.rift?.holder).toBe("open");
    expect(s.rift?.s15UsesPlayer).toBe(0);
  });
});

describe("S16 RIFT_RESONANCE — 抽 2 + 鬥志 +20，佔據時佔據者疾走", () => {
  it("有 rift 時：抽 2 + 鬥志 +20 + s16UsedPlayer=true", () => {
    const s = mkState({ stability: 40 });
    openRiftIfNeeded(s);
    s.player.deck = [
      { instanceId: "d1", cardId: "T01" },
      { instanceId: "d2", cardId: "T02" },
      { instanceId: "d3", cardId: "T03" },
    ];
    s.player.hero.morale = 0;
    executeEffects([{ kind: "scripted", tag: "RIFT_RESONANCE" }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S16",
    });
    expect(s.player.hand.length).toBe(2);
    expect(s.player.hero.morale).toBe(20);
    expect(s.rift?.s16UsedPlayer).toBe(true);
  });

  it("玩家佔據時：佔據者清 hasAttackedThisTurn + summonedThisTurn（疾走）", () => {
    const s = mkState({ stability: 40 });
    openRiftIfNeeded(s);
    // 模擬玩家剛佔據（部署當回合）
    const c = getCard("T02");
    if (c.type !== "troop") throw new Error("not troop");
    s.rift!.holder = "player";
    s.rift!.occupant = {
      instanceId: "occ1", cardId: "T02",
      hp: c.hp, maxHp: c.hp, atk: c.atk, def: c.def,
      keywords: new Set(c.keywords),
      hasAttackedThisTurn: true, summonedThisTurn: true, frozenTurns: 0, buffs: [],
    };
    executeEffects([{ kind: "scripted", tag: "RIFT_RESONANCE" }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S16",
    });
    expect(s.rift?.occupant?.hasAttackedThisTurn).toBe(false);
    expect(s.rift?.occupant?.summonedThisTurn).toBe(false);
  });

  it("無 rift 時 noop", () => {
    const s = mkState({ stability: 100 });
    s.player.hero.morale = 0;
    executeEffects([{ kind: "scripted", tag: "RIFT_RESONANCE" }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "S16",
    });
    expect(s.player.hero.morale).toBe(0);
  });
});

describe("F08 FIELD_DIMENSIONAL_RIFT — 升級為加強裂縫", () => {
  it("已有 rift 時：enhanced=true", () => {
    const s = mkState({ stability: 40 });
    openRiftIfNeeded(s);
    expect(s.rift?.enhanced).toBe(false);
    executeEffects([{ kind: "scripted", tag: "FIELD_DIMENSIONAL_RIFT" }], {
      state: s, ctx, sourceSide: "player", sourceKind: "field", sourceCardId: "F08",
    });
    expect(s.rift?.enhanced).toBe(true);
  });

  it("玩家佔據時：佔據者獲〔穿透〕", () => {
    const s = mkState({ stability: 40 });
    openRiftIfNeeded(s);
    const c = getCard("T02");
    if (c.type !== "troop") throw new Error("not troop");
    s.rift!.holder = "player";
    s.rift!.occupant = {
      instanceId: "occ1", cardId: "T02",
      hp: c.hp, maxHp: c.hp, atk: c.atk, def: c.def,
      keywords: new Set(c.keywords),
      hasAttackedThisTurn: false, summonedThisTurn: false, frozenTurns: 0, buffs: [],
    };
    executeEffects([{ kind: "scripted", tag: "FIELD_DIMENSIONAL_RIFT" }], {
      state: s, ctx, sourceSide: "player", sourceKind: "field", sourceCardId: "F08",
    });
    expect(s.rift?.occupant?.keywords.has("pierce")).toBe(true);
  });

  it("無 rift 時 noop（不報錯）", () => {
    const s = mkState({ stability: 100 });
    expect(() => {
      executeEffects([{ kind: "scripted", tag: "FIELD_DIMENSIONAL_RIFT" }], {
        state: s, ctx, sourceSide: "player", sourceKind: "field", sourceCardId: "F08",
      });
    }).not.toThrow();
    expect(s.rift).toBeUndefined();
  });
});

describe("N05 DIMENSION_SHARD — 滿值改全體傷害；否則 +25 + 抽 1", () => {
  it("stability=100：對敵方全體（英雄 + 兵力）造 15 傷害", () => {
    const s = mkState({ stability: 100 });
    s.enemy.hero.hp = 50;
    s.enemy.hero.def = 0;
    const c = getCard("T02");
    if (c.type !== "troop") throw new Error("not troop");
    s.enemy.troopSlots[0] = {
      instanceId: "et1", cardId: "T02",
      hp: c.hp, maxHp: c.hp, atk: c.atk, def: c.def,
      keywords: new Set(c.keywords),
      hasAttackedThisTurn: false, summonedThisTurn: false, frozenTurns: 0, buffs: [],
    };
    executeEffects([{ kind: "scripted", tag: "DIMENSION_SHARD" }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "N05",
    });
    expect(s.enemy.hero.hp).toBe(35); // 50 - 15
    // T02 def=2，15 - 2 = 13 → hp 12 - 13 = 0
    expect(s.enemy.troopSlots[0]?.hp ?? 0).toBeLessThanOrEqual(0);
    expect(s.stability).toBe(100); // 不變
  });

  it("stability=70：+25 → 95 + 抽 1", () => {
    const s = mkState({ stability: 70 });
    s.player.deck = [{ instanceId: "d1", cardId: "T01" }];
    executeEffects([{ kind: "scripted", tag: "DIMENSION_SHARD" }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "N05",
    });
    expect(s.stability).toBe(95);
    expect(s.player.hand).toHaveLength(1);
  });

  it("stability=40：+25 → 65（升離 stage 2，但裂縫已存在不影響）", () => {
    const s = mkState({ stability: 40 });
    openRiftIfNeeded(s); // 預先開啟
    expect(s.rift).toBeDefined();
    s.player.deck = [{ instanceId: "d1", cardId: "T01" }];
    executeEffects([{ kind: "scripted", tag: "DIMENSION_SHARD" }], {
      state: s, ctx, sourceSide: "player", sourceKind: "spell", sourceCardId: "N05",
    });
    expect(s.stability).toBe(65);
    expect(s.rift).toBeDefined(); // 裂縫不關閉
  });
});

describe("整合：穩定度跨 50 → 開裂縫 → 自動滲透 → 玩家擊殺 → 重歸 open", () => {
  it("完整拉鋸戰循環", () => {
    const s = mkState({ stability: 60 });
    // 穩定度從 60 → 40 跨閾值
    executeEffects([{ kind: "stability", delta: -20 }], {
      state: s, ctx, sourceSide: "enemy", sourceKind: "field", sourceCardId: "test",
    });
    expect(s.rift).toBeDefined();
    expect(s.rift?.holder).toBe("open");

    // 模擬 endTurnFor → tickRiftTremor → 滲透
    triggerInfiltration(s, ctx);
    expect(s.rift?.holder).toBe("enemy");
    const occ = s.rift!.occupant!;
    expect(occ.fromRift).toBe(true);

    // 玩家擊殺
    occ.hp = 0;
    // 模擬 reapDeadTroops vacate
    s.rift!.occupant = null;
    s.rift!.holder = "open";
    s.rift!.tremorCountdown = 1;
    expect(s.rift?.holder).toBe("open");
  });
});
