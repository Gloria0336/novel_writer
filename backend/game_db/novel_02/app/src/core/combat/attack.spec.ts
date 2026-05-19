import { beforeEach, describe, expect, it } from "vitest";
import type { BattleState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { Keyword } from "../types/keyword";
import { canActionTarget, canTroopAttack, troopVsHero, troopVsTroop } from "./attack";
import { applyHeroDamage, applyTroopDamage } from "./damage";
import { getRace } from "../../data/races";
import { getClass } from "../../data/classes";

interface TroopOverrides {
  instanceId?: string;
  cardId?: string;
  atk: number;
  hp: number;
  def?: number;
  keywords?: Keyword[];
  hasAttackedThisTurn?: boolean;
  summonedThisTurn?: boolean;
  frozenTurns?: number;
}

function mkTroop(overrides: TroopOverrides): TroopInstance {
  return {
    instanceId: overrides.instanceId ?? `t_${Math.random()}`,
    cardId: overrides.cardId ?? "TX",
    hp: overrides.hp,
    maxHp: overrides.hp,
    atk: overrides.atk,
    def: overrides.def ?? 0,
    keywords: new Set(overrides.keywords ?? []),
    hasAttackedThisTurn: overrides.hasAttackedThisTurn ?? false,
    summonedThisTurn: overrides.summonedThisTurn ?? false,
    frozenTurns: overrides.frozenTurns ?? 0,
    buffs: [],
  };
}

function mkBattleState(playerTroops: (TroopInstance | null)[], enemyTroops: (TroopInstance | null)[], heroHp = 80): BattleState {
  return {
    seed: 1, rngState: 1, nextInstanceId: 100, turn: 1, activeSide: "player", phase: "main",
    player: {
      hero: { defId: "p", hp: heroHp, maxHp: heroHp, atk: 5, def: 5, cmd: 5, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
      manaCurrent: 0, manaCap: 0, manaCapAbsolute: 10, tempMana: 0,
      deck: [], hand: [], graveyard: [], troopSlots: playerTroops, spellsCastThisTurn: 0, spellsCastThisGame: 0,
    },
    enemy: {
      hero: { defId: "e", hp: heroHp, maxHp: heroHp, atk: 5, def: 0, cmd: 5, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
      manaCurrent: 0, manaCap: 0, manaCapAbsolute: 10, tempMana: 0,
      deck: [], hand: [], graveyard: [], troopSlots: enemyTroops, spellsCastThisTurn: 0, spellsCastThisGame: 0,
    },
    field: { player: null, enemy: null }, omen: null, stability: 100, corruptionStage: 0, log: [], result: "ongoing",
  };
}

const ctx: BattleContext = {
  getCard: () => { throw new Error("unused"); },
  getHero: (id) => ({
    id,
    name: id,
    raceId: "human",
    classId: "commander",
    rarity: "R",
    statTuning: {},
    gauge: { description: "" },
    passives: [],
    actives: [],
    ultimate: { id: "u", name: "u", description: "", cost: {}, effects: [] },
  }),
  getRace: (id) => getRace(id as Parameters<typeof getRace>[0]),
  getClass: (id) => getClass(id as Parameters<typeof getClass>[0]),
};

describe("damage 計算", () => {
  it("DEF 會吸收傷害", () => {
    const t = mkTroop({ atk: 0, hp: 10, def: 3 });
    const r = applyTroopDamage(t, 5);
    expect(r.finalAmount).toBe(2);
    expect(t.hp).toBe(8);
  });

  it("ignoreDef 跳過 DEF", () => {
    const t = mkTroop({ atk: 0, hp: 10, def: 5 });
    const r = applyTroopDamage(t, 5, { ignoreDef: true });
    expect(r.finalAmount).toBe(5);
    expect(t.hp).toBe(5);
  });

  it("DEF 完全抵銷時仍造成 1 點傷害", () => {
    const t = mkTroop({ atk: 0, hp: 10, def: 99 });
    const r = applyTroopDamage(t, 5);
    expect(r.finalAmount).toBe(1);
    expect(t.hp).toBe(9);
  });

  it("英雄 DEF 完全抵銷時仍造成 1 點傷害", () => {
    const hero = { defId: "x", hp: 80, maxHp: 80, atk: 0, def: 99, cmd: 5, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } };
    const r = applyHeroDamage(hero, 5);
    expect(r.finalAmount).toBe(1);
    expect(hero.hp).toBe(79);
  });

  it("0 點原始傷害不會觸發最低傷害", () => {
    const t = mkTroop({ atk: 0, hp: 10, def: 99 });
    const r = applyTroopDamage(t, 0);
    expect(r.finalAmount).toBe(0);
    expect(t.hp).toBe(10);
  });

  it("英雄護甲會優先吸收（DEF 之後）", () => {
    const hero = { defId: "x", hp: 80, maxHp: 80, atk: 0, def: 5, cmd: 5, morale: 0, gaugeValue: 0, armor: 10, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } };
    const r = applyHeroDamage(hero, 20); // 20 - DEF 5 = 15, armor 10 absorbs 10, 5 to HP
    expect(r.finalAmount).toBe(5);
    expect(hero.armor).toBe(0);
    expect(hero.hp).toBe(75);
  });

  it("固定傷害無視 DEF 與護甲", () => {
    const hero = { defId: "x", hp: 80, maxHp: 80, atk: 0, def: 5, cmd: 5, morale: 0, gaugeValue: 0, armor: 10, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } };
    const r = applyHeroDamage(hero, 20, { fixed: true });
    expect(r.finalAmount).toBe(20);
    expect(hero.armor).toBe(10);
    expect(hero.hp).toBe(60);
  });
});

describe("status target priority", () => {
  it("taunt has higher priority than guard and marked", () => {
    const taunt = mkTroop({ atk: 2, hp: 10 });
    const guard = mkTroop({ atk: 2, hp: 10, keywords: ["guard"] });
    const marked = mkTroop({ atk: 2, hp: 10 });
    taunt.statusBuffs = [{ id: "s1", source: "test", status: "taunt", remainingTurns: 1 }];
    marked.statusBuffs = [{ id: "s2", source: "test", status: "marked", remainingTurns: 1 }];
    const state = mkBattleState([], [taunt, guard, marked]);

    expect(canActionTarget(state, "player", guard).ok).toBe(false);
    expect(canActionTarget(state, "player", marked).ok).toBe(false);
    expect(canActionTarget(state, "player", taunt).ok).toBe(true);
  });

  it("marked lets troops and actions bypass protection to hit the marked unit", () => {
    const guard = mkTroop({ atk: 2, hp: 10, keywords: ["guard"] });
    const marked = mkTroop({ atk: 2, hp: 10 });
    marked.statusBuffs = [{ id: "s1", source: "test", status: "marked", remainingTurns: 1 }];
    const attacker = mkTroop({ atk: 5, hp: 10 });
    const state = mkBattleState([attacker], [guard, marked]);

    expect(canTroopAttack(state, "player", attacker, marked).ok).toBe(true);
    expect(canActionTarget(state, "player", marked).ok).toBe(true);
    expect(canActionTarget(state, "player", "hero").ok).toBe(false);
  });

  it("marked on a hero lets troops attack that hero through troop priority", () => {
    const blocker = mkTroop({ atk: 2, hp: 10 });
    const attacker = mkTroop({ atk: 5, hp: 10 });
    const state = mkBattleState([attacker], [blocker]);
    state.enemy.hero.statusBuffs = [{ id: "s1", source: "test", status: "marked", remainingTurns: 1 }];

    expect(canTroopAttack(state, "player", attacker, "hero").ok).toBe(true);
  });

  it("untargetable blocks enemy targeted actions and attacks", () => {
    const hidden = mkTroop({ atk: 2, hp: 10 });
    const attacker = mkTroop({ atk: 5, hp: 10 });
    hidden.statusBuffs = [{ id: "s1", source: "test", status: "untargetable", remainingTurns: 1 }];
    const state = mkBattleState([attacker], [hidden]);

    expect(canTroopAttack(state, "player", attacker, hidden).ok).toBe(false);
    expect(canActionTarget(state, "player", hidden).ok).toBe(false);
  });

  it("invincible allows DEF to reduce non-piercing damage to 0", () => {
    const target = mkTroop({ atk: 0, hp: 10, def: 99 });
    target.statusBuffs = [{ id: "s1", source: "test", status: "invincible", remainingTurns: 1 }];

    const r = applyTroopDamage(target, 5);

    expect(r.finalAmount).toBe(0);
    expect(target.hp).toBe(10);
  });
});

describe("雙軌規則 — 兵力攻擊（兵力優先）", () => {
  it("有敵方兵力時，兵力不可攻擊敵方英雄", () => {
    const enemy = mkTroop({ atk: 3, hp: 10 });
    const state = mkBattleState([null], [enemy]);
    const me = mkTroop({ atk: 5, hp: 10 });
    state.player.troopSlots[0] = me;
    const r = canTroopAttack(state, "player", me, "hero");
    expect(r.ok).toBe(false);
  });

  it("無敵方兵力時，兵力可攻擊敵方英雄", () => {
    const state = mkBattleState([null], [null]);
    const me = mkTroop({ atk: 5, hp: 10 });
    state.player.troopSlots[0] = me;
    expect(canTroopAttack(state, "player", me, "hero").ok).toBe(true);
  });

  it("有敵方兵力時，兵力可攻擊敵方兵力", () => {
    const enemy = mkTroop({ atk: 3, hp: 10 });
    const state = mkBattleState([null], [enemy]);
    const me = mkTroop({ atk: 5, hp: 10 });
    state.player.troopSlots[0] = me;
    expect(canTroopAttack(state, "player", me, enemy).ok).toBe(true);
  });
});

describe("雙軌規則 — 行動卡（守護優先）", () => {
  it("敵方有守護兵力時，行動卡只能打守護", () => {
    const guard = mkTroop({ atk: 2, hp: 10, keywords: ["guard"] });
    const normal = mkTroop({ atk: 3, hp: 10 });
    const state = mkBattleState([], [guard, normal]);
    expect(canActionTarget(state, "player", normal).ok).toBe(false);
    expect(canActionTarget(state, "player", guard).ok).toBe(true);
    expect(canActionTarget(state, "player", "hero").ok).toBe(false);
  });

  it("敵方無守護時，行動卡可打任何目標", () => {
    const normal = mkTroop({ atk: 3, hp: 10 });
    const state = mkBattleState([], [normal]);
    expect(canActionTarget(state, "player", normal).ok).toBe(true);
    expect(canActionTarget(state, "player", "hero").ok).toBe(true);
  });

  it("ignoreGuard=true 時，可繞過守護", () => {
    const guard = mkTroop({ atk: 2, hp: 10, keywords: ["guard"] });
    const state = mkBattleState([], [guard]);
    expect(canActionTarget(state, "player", "hero", true).ok).toBe(true);
  });
});

describe("關鍵字 — 暈眩、突進、疾走、必殺、威壓、凍結", () => {
  it("部署當回合不可攻擊（無突進/疾走）", () => {
    const enemy = mkTroop({ atk: 0, hp: 5 });
    const state = mkBattleState([], [enemy]);
    const me = mkTroop({ atk: 5, hp: 10, summonedThisTurn: true });
    state.player.troopSlots = [me];
    expect(canTroopAttack(state, "player", me, enemy).ok).toBe(false);
  });

  it("突進：部署當回合可攻擊敵方兵力，但不可打英雄", () => {
    const enemy = mkTroop({ atk: 0, hp: 5 });
    const state = mkBattleState([], [enemy]);
    const me = mkTroop({ atk: 5, hp: 10, summonedThisTurn: true, keywords: ["rush"] });
    state.player.troopSlots = [me];
    expect(canTroopAttack(state, "player", me, enemy).ok).toBe(true);

    // 拿走敵兵測「打英雄」
    state.enemy.troopSlots = [null];
    expect(canTroopAttack(state, "player", me, "hero").ok).toBe(false);
  });

  it("疾走：部署當回合可攻擊任何目標", () => {
    const state = mkBattleState([], [null]);
    const me = mkTroop({ atk: 5, hp: 10, summonedThisTurn: true, keywords: ["haste"] });
    state.player.troopSlots = [me];
    expect(canTroopAttack(state, "player", me, "hero").ok).toBe(true);
  });

  it("威壓：不可被敵方兵力選為攻擊目標", () => {
    const target = mkTroop({ atk: 1, hp: 10, keywords: ["menace"] });
    const me = mkTroop({ atk: 5, hp: 10 });
    const state = mkBattleState([me], [target]);
    expect(canTroopAttack(state, "player", me, target).ok).toBe(false);
  });

  it("凍結：不可攻擊", () => {
    const state = mkBattleState([], [null]);
    const me = mkTroop({ atk: 5, hp: 10, frozenTurns: 1 });
    state.player.troopSlots = [me];
    expect(canTroopAttack(state, "player", me, "hero").ok).toBe(false);
  });

  it("必殺：兵力交戰必定摧毀對方", () => {
    const me = mkTroop({ atk: 1, hp: 10, keywords: ["lethal"] });
    const big = mkTroop({ atk: 1, hp: 100 });
    const state = mkBattleState([me], [big]);
    const r = troopVsTroop(state, ctx, me, "player", big, "enemy");
    expect(r.defenderKilled).toBe(true);
    expect(big.hp).toBe(0);
  });

  it("穿透：攻擊時無視 DEF", () => {
    const me = mkTroop({ atk: 5, hp: 10, keywords: ["pierce"] });
    const tank = mkTroop({ atk: 0, hp: 10, def: 99 });
    const state = mkBattleState([me], [tank]);
    const r = troopVsTroop(state, ctx, me, "player", tank, "enemy");
    expect(r.defenderDamage).toBe(5);
    expect(tank.hp).toBe(5);
  });
});

describe("troopVsHero — 直接打臉", () => {
  it("英雄受傷且攻擊兵力被標記已攻擊", () => {
    const state = mkBattleState([], [null]);
    const me = mkTroop({ atk: 8, hp: 10 });
    state.player.troopSlots = [me];
    troopVsHero(state, ctx, me, "player");
    expect(state.enemy.hero.hp).toBe(80 - 8);
    expect(me.hasAttackedThisTurn).toBe(true);
  });
});

describe("troopVsTroop — 雙方互相造傷", () => {
  it("基本交戰雙方都掉血", () => {
    const a = mkTroop({ atk: 5, hp: 10 });
    const b = mkTroop({ atk: 3, hp: 10 });
    const state = mkBattleState([a], [b]);
    troopVsTroop(state, ctx, a, "player", b, "enemy");
    expect(b.hp).toBe(5);
    expect(a.hp).toBe(7);
  });

  it("攻擊者已攻擊過後不可再攻擊（由上層 canTroopAttack 把關）", () => {
    const a = mkTroop({ atk: 5, hp: 10 });
    const b = mkTroop({ atk: 3, hp: 10 });
    const state = mkBattleState([a], [b]);
    troopVsTroop(state, ctx, a, "player", b, "enemy");
    expect(a.hasAttackedThisTurn).toBe(true);
  });
});
