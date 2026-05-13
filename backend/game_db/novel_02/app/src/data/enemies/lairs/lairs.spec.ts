import { describe, expect, it } from "vitest";
import { LAIR_LIST, LAIRS } from "./index";
import { ENEMY_PROFILES } from "../../../core/ai/profiles";
import { getCard } from "../../cards";
import { ensureScriptedRegistered } from "../../../game/seed";
import { executeEffects } from "../../../core/effects/registry";
import { createBattleContext } from "../../../game/seed";
import type { BattleState, TroopInstance } from "../../../core/types/battle";

const expectedStats: Record<string, { hp: number; def: number }> = {
  putrefactive_lair: { hp:  80, def: 0 },
  insect_hive:       { hp: 100, def: 2 },
  beast_cave:        { hp: 120, def: 3 },
  shadow_gate:       { hp: 150, def: 5 },
  crystal_vein:      { hp: 100, def: 8 },
  corrupted_temple:  { hp: 200, def: 3 },
};

function freshTroop(cardId: string, instanceId: string): TroopInstance {
  const card = getCard(cardId);
  if (card.type !== "troop") throw new Error("not a troop");
  return {
    instanceId,
    cardId,
    hp: card.hp, maxHp: card.hp,
    atk: card.atk, def: card.def,
    keywords: new Set(card.keywords),
    hasAttackedThisTurn: false, summonedThisTurn: false, frozenTurns: 0,
    buffs: [],
  };
}

function mkState(): BattleState {
  return {
    seed: 1, rngState: 1, nextInstanceId: 100, turn: 1,
    activeSide: "enemy", phase: "main",
    player: {
      hero: { defId: "lulu", hp: 80, maxHp: 80, atk: 10, def: 5, cmd: 5, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
      manaCurrent: 0, manaCap: 0, manaCapAbsolute: 10, tempMana: 0,
      deck: [], hand: [], graveyard: [],
      troopSlots: [null, null, null, null, null],
      spellsCastThisTurn: 0, spellsCastThisGame: 0,
    },
    enemy: {
      hero: { defId: "corrupted_temple", hp: 100, maxHp: 200, atk: 0, def: 3, cmd: 5, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: true, immortalUsed: false } },
      manaCurrent: 0, manaCap: 0, manaCapAbsolute: 10, tempMana: 0,
      deck: [], hand: [], graveyard: [],
      troopSlots: [null, null, null, null, null],
      spellsCastThisTurn: 0, spellsCastThisGame: 0,
    },
    field: null,
    stability: 100, corruptionStage: 0,
    log: [], result: "ongoing",
  };
}

describe("§E.2 巢穴註冊與數值", () => {
  ensureScriptedRegistered();

  for (const lair of LAIR_LIST) {
    it(`${lair.name} 數值符合設計表`, () => {
      const inst = lair.createInstance();
      const want = expectedStats[lair.id]!;
      expect(inst.maxHp).toBe(want.hp);
      expect(inst.def).toBe(want.def);
    });

    it(`${lair.name} 內部兵力卡可被 getCard 取得`, () => {
      for (const troop of lair.internalTroops) {
        expect(() => getCard(troop.id)).not.toThrow();
      }
    });

    it(`${lair.name} AI profile 已註冊`, () => {
      expect(ENEMY_PROFILES[lair.profileId]).toBeDefined();
    });
  }

  it("6 巢穴均註冊", () => {
    expect(Object.keys(LAIRS)).toHaveLength(6);
  });
});

describe("§E.2 巢穴 scripted 機制", () => {
  ensureScriptedRegistered();
  const ctx = createBattleContext();

  it("TEMPLE_PRIEST_HEAL：有祭司存活時 +5 HP", () => {
    const s = mkState();
    s.enemy.hero.hp = 100;
    s.enemy.troopSlots[0] = freshTroop("I_TEMPLE_PRIEST", "p1");
    executeEffects(
      [{ kind: "scripted", tag: "TEMPLE_PRIEST_HEAL" }],
      { state: s, ctx, sourceSide: "enemy", sourceKind: "passive" },
    );
    expect(s.enemy.hero.hp).toBe(105);
  });

  it("TEMPLE_PRIEST_HEAL：無祭司時不回血", () => {
    const s = mkState();
    s.enemy.hero.hp = 100;
    executeEffects(
      [{ kind: "scripted", tag: "TEMPLE_PRIEST_HEAL" }],
      { state: s, ctx, sourceSide: "enemy", sourceKind: "passive" },
    );
    expect(s.enemy.hero.hp).toBe(100);
  });

  it("INSECT_MERGE：5 隻蟲母幼體合併為蟲后", () => {
    const s = mkState();
    for (let i = 0; i < 5; i++) {
      s.enemy.troopSlots[i] = freshTroop("I_QUEEN_LARVA", `l${i}`);
    }
    executeEffects(
      [{ kind: "scripted", tag: "INSECT_MERGE" }],
      { state: s, ctx, sourceSide: "enemy", sourceKind: "passive" },
    );
    const queens = s.enemy.troopSlots.filter((t) => t && t.cardId === "I_INSECT_QUEEN");
    const larvae = s.enemy.troopSlots.filter((t) => t && t.cardId === "I_QUEEN_LARVA");
    expect(queens).toHaveLength(1);
    expect(larvae).toHaveLength(0);
  });

  it("CRYSTAL_MERGE：3 隻晶體碎片合併為晶體魔像", () => {
    const s = mkState();
    for (let i = 0; i < 3; i++) {
      s.enemy.troopSlots[i] = freshTroop("I_CRYSTAL_SHARD", `c${i}`);
    }
    executeEffects(
      [{ kind: "scripted", tag: "CRYSTAL_MERGE" }],
      { state: s, ctx, sourceSide: "enemy", sourceKind: "passive" },
    );
    const golems = s.enemy.troopSlots.filter((t) => t && t.cardId === "I_CRYSTAL_GOLEM");
    const shards = s.enemy.troopSlots.filter((t) => t && t.cardId === "I_CRYSTAL_SHARD");
    expect(golems).toHaveLength(1);
    expect(shards).toHaveLength(0);
  });

  it("SHADOW_TICK：每次觸發穩定度 -3", () => {
    const s = mkState();
    s.stability = 50;
    executeEffects(
      [{ kind: "scripted", tag: "SHADOW_TICK" }],
      { state: s, ctx, sourceSide: "enemy", sourceKind: "passive" },
    );
    expect(s.stability).toBe(47);
  });

  it("BEAST_HALFHP_DOUBLE_ATK：半血時友方兵力 ATK 翻倍且只觸發一次", () => {
    const s = mkState();
    s.enemy.hero.defId = "beast_cave";
    s.enemy.hero.hp = 60; s.enemy.hero.maxHp = 120;
    s.enemy.troopSlots[0] = freshTroop("I_FERAL_BEAST", "b1");
    const beforeAtk = s.enemy.troopSlots[0]!.atk;

    executeEffects(
      [{ kind: "scripted", tag: "BEAST_HALFHP_DOUBLE_ATK" }],
      { state: s, ctx, sourceSide: "enemy", sourceKind: "passive" },
    );
    expect(s.enemy.troopSlots[0]!.atk).toBe(beforeAtk * 2);

    // 第二次觸發不應再加
    const afterAtk = s.enemy.troopSlots[0]!.atk;
    executeEffects(
      [{ kind: "scripted", tag: "BEAST_HALFHP_DOUBLE_ATK" }],
      { state: s, ctx, sourceSide: "enemy", sourceKind: "passive" },
    );
    expect(s.enemy.troopSlots[0]!.atk).toBe(afterAtk);
  });
});
