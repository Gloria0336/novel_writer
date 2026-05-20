import { describe, expect, it } from "vitest";
import type { BattleState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { Keyword } from "../types/keyword";
import { getClass } from "../../data/classes";
import { getRace } from "../../data/races";
import { canTroopAttack, troopVsHero, troopVsTroop } from "./attack";

function troop(overrides: {
  atk: number;
  hp: number;
  def?: number;
  keywords?: Keyword[];
  instanceId?: string;
}): TroopInstance {
  return {
    instanceId: overrides.instanceId ?? `t_${Math.random()}`,
    cardId: "T_test",
    hp: overrides.hp,
    maxHp: overrides.hp,
    atk: overrides.atk,
    def: overrides.def ?? 0,
    keywords: new Set(overrides.keywords ?? []),
    hasAttackedThisTurn: false,
    summonedThisTurn: false,
    frozenTurns: 0,
    buffs: [],
    keywordBuffs: [],
    statusBuffs: [],
  };
}

function state(playerTroops: (TroopInstance | null)[], enemyTroops: (TroopInstance | null)[], heroHp = 80): BattleState {
  return {
    seed: 1, rngState: 1, nextInstanceId: 100, turn: 1, activeSide: "player", phase: "main",
    player: {
      hero: { defId: "p", hp: heroHp, maxHp: heroHp, atk: 5, def: 0, cmd: 5, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
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

describe("combat keywords - menace and lifesteal", () => {
  it("menace blocks troop attacks unless the target has priority status", () => {
    const attacker = troop({ atk: 5, hp: 10 });
    const target = troop({ atk: 1, hp: 10, keywords: ["menace"] });
    const battle = state([attacker], [target]);

    expect(canTroopAttack(battle, "player", attacker, target).ok).toBe(false);

    target.statusBuffs = [{ id: "marked", source: "test", status: "marked", remainingTurns: 1 }];
    expect(canTroopAttack(battle, "player", attacker, target).ok).toBe(true);
  });

  it("lifesteal heals the attacker hero when a troop damages a hero", () => {
    const attacker = troop({ atk: 8, hp: 10, keywords: ["lifesteal"] });
    const battle = state([attacker], []);
    battle.player.hero.hp = 50;

    troopVsHero(battle, ctx, attacker, "player");

    expect(battle.enemy.hero.hp).toBe(72);
    expect(battle.player.hero.hp).toBe(58);
  });

  it("lifesteal heals the attacker hero when a troop damages a troop", () => {
    const attacker = troop({ atk: 6, hp: 10, keywords: ["lifesteal"] });
    const target = troop({ atk: 0, hp: 10, def: 2 });
    const battle = state([attacker], [target]);
    battle.player.hero.hp = 50;

    troopVsTroop(battle, ctx, attacker, "player", target, "enemy");

    expect(target.hp).toBe(6);
    expect(battle.player.hero.hp).toBe(54);
  });

  it("lifesteal heals the defender hero when a lifesteal defender counters", () => {
    const attacker = troop({ atk: 5, hp: 10 });
    const defender = troop({ atk: 4, hp: 10, keywords: ["lifesteal"] });
    const battle = state([attacker], [defender]);
    battle.enemy.hero.hp = 50;

    troopVsTroop(battle, ctx, attacker, "player", defender, "enemy");

    expect(attacker.hp).toBe(6);
    expect(battle.enemy.hero.hp).toBe(54);
  });
});
