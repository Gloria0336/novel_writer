import { describe, expect, it } from "vitest";
import type { BattleState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { HeroDefinition, RaceId } from "../types/hero";
import { getRace } from "../../data/races";
import { getClass } from "../../data/classes";
import { getCard } from "../../data/cards";
import { executeEffects } from "../effects/registry";
import { startTurnFor } from "../turn/phases";
import { troopVsTroop } from "../combat/attack";
import { getEffectiveCardCost, syncFullGaugeBuffs } from "./fullGaugeBuff";

function hero(id: string, raceId: RaceId): HeroDefinition {
  return {
    id,
    name: id,
    raceId,
    classId: "commander",
    rarity: "R",
    statTuning: {},
    gauge: { description: "" },
    passives: [],
    actives: [],
    ultimate: { id: `${id}_ult`, name: "ult", description: "", cost: {}, effects: [] },
  };
}

const HERO_DEFS: Record<string, HeroDefinition> = {
  humanHero: hero("humanHero", "human"),
  elfHero: hero("elfHero", "elf"),
  dwarfHero: hero("dwarfHero", "dwarf"),
  feyHero: hero("feyHero", "fey"),
  demonHero: hero("demonHero", "demon"),
};

const ctx: BattleContext = {
  getCard,
  getHero: (id) => {
    const def = HERO_DEFS[id];
    if (!def) throw new Error(`unknown hero ${id}`);
    return def;
  },
  getRace: (id) => getRace(id as Parameters<typeof getRace>[0]),
  getClass: (id) => getClass(id as Parameters<typeof getClass>[0]),
};

function mkTroop(id: string, atk: number, def: number, hp = 20): TroopInstance {
  return {
    instanceId: id,
    cardId: id,
    hp,
    maxHp: hp,
    atk,
    def,
    keywords: new Set(),
    hasAttackedThisTurn: false,
    summonedThisTurn: false,
    frozenTurns: 0,
    buffs: [],
    keywordBuffs: [],
  };
}

function mkState(playerHeroId = "humanHero", enemyHeroId = "humanHero"): BattleState {
  return {
    seed: 1,
    rngState: 1,
    nextInstanceId: 100,
    turn: 5,
    activeSide: "player",
    phase: "main",
    player: {
      hero: { defId: playerHeroId, hp: 80, maxHp: 80, atk: 10, def: 5, cmd: 5, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
      manaCurrent: 5,
      manaCap: 5,
      manaCapAbsolute: 10,
      tempMana: 0,
      deck: [],
      hand: [],
      graveyard: [],
      troopSlots: [null, null, null, null, null],
      spellsCastThisTurn: 0,
      spellsCastThisGame: 0,
    },
    enemy: {
      hero: { defId: enemyHeroId, hp: 80, maxHp: 80, atk: 10, def: 0, cmd: 5, morale: 0, gaugeValue: 0, armor: 0, buffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
      manaCurrent: 5,
      manaCap: 5,
      manaCapAbsolute: 10,
      tempMana: 0,
      deck: [],
      hand: [],
      graveyard: [],
      troopSlots: [null, null, null, null, null],
      spellsCastThisTurn: 0,
      spellsCastThisGame: 0,
    },
    field: null,
    stability: 100,
    corruptionStage: 0,
    log: [],
    result: "ongoing",
  };
}

describe("滿值種族 Buff", () => {
  it("人類滿軍令給所有兵力 +1/+1，量表下降後移除", () => {
    const state = mkState("humanHero");
    const troop = mkTroop("H01", 2, 2);
    state.player.troopSlots[0] = troop;
    state.player.hero.gaugeValue = 100;

    syncFullGaugeBuffs(state, ctx);
    expect(troop.atk).toBe(3);
    expect(troop.def).toBe(3);

    state.player.hero.gaugeValue = 90;
    syncFullGaugeBuffs(state, ctx);
    expect(troop.atk).toBe(2);
    expect(troop.def).toBe(2);
  });

  it("精靈滿共鳴在回合開始給 +1 臨時魔力，隨後共鳴重置", () => {
    const state = mkState("elfHero");
    state.player.hero.gaugeValue = 10;

    startTurnFor(state, "player", ctx);
    expect(state.player.manaCurrent).toBe(5);
    expect(state.player.tempMana).toBe(1);
    expect(state.player.hero.gaugeValue).toBe(0);
  });

  it("矮人滿爐火讓裝備與器具費用 -1，最低 1", () => {
    const state = mkState("dwarfHero");
    state.player.hero.gaugeValue = 100;

    expect(getEffectiveCardCost(state, ctx, "player", getCard("D10"))).toBe(7);
    expect(getEffectiveCardCost(state, ctx, "player", getCard("K02"))).toBe(2);
    expect(getEffectiveCardCost(state, ctx, "player", getCard("D02"))).toBe(1);
  });

  it("妖族人形滿靈蘊只加法術效果，妖形加行動傷害與 DEF", () => {
    const state = mkState("feyHero");
    state.player.hero.gaugeValue = 100;
    state.player.hero.flags.feyForm = "human";

    executeEffects([{ kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "const", value: 10 } }], {
      state,
      ctx,
      sourceSide: "player",
      sourceKind: "spell",
    });
    expect(state.enemy.hero.hp).toBe(68);

    state.enemy.hero.hp = 80;
    state.player.hero.flags.feyForm = "fey";
    syncFullGaugeBuffs(state, ctx);
    expect(state.player.hero.def).toBe(8);

    executeEffects([{ kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "const", value: 10 } }], {
      state,
      ctx,
      sourceSide: "player",
      sourceKind: "action",
    });
    expect(state.enemy.hero.hp).toBe(69);
  });

  it("惡魔滿黑暗蝕讓兵力傷害 +10%，且回合開始回復 3 HP", () => {
    const state = mkState("humanHero", "demonHero");
    state.enemy.hero.gaugeValue = 100;
    const attacker = mkTroop("DM01", 10, 0);
    const defender = mkTroop("H01", 0, 0);
    state.enemy.troopSlots[0] = attacker;
    state.player.troopSlots[0] = defender;

    troopVsTroop(state, ctx, attacker, "enemy", defender, "player");
    expect(defender.hp).toBe(9);

    attacker.hp = 10;
    startTurnFor(state, "enemy", ctx);
    expect(attacker.hp).toBe(13);
  });
});
