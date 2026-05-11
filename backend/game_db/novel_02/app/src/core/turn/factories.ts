import type { BattleState, TroopInstance } from "../types/battle";
import type { TroopCard } from "../types/card";
import type { HeroDefinition, HeroInstance } from "../types/hero";
import { composeHeroStats } from "../stats/compose";
import type { BattleContext } from "../types/context";

export function nextInstanceId(state: BattleState, prefix = "i"): string {
  state.nextInstanceId++;
  return `${prefix}${state.nextInstanceId}`;
}

export function createTroopInstance(state: BattleState, card: TroopCard, opts?: { suppressSummonSickness?: boolean }): TroopInstance {
  return {
    instanceId: nextInstanceId(state, "t"),
    cardId: card.id,
    hp: card.hp,
    maxHp: card.hp,
    atk: card.atk,
    def: card.def,
    keywords: new Set(card.keywords),
    hasAttackedThisTurn: false,
    summonedThisTurn: !opts?.suppressSummonSickness,
    frozenTurns: 0,
    buffs: [],
  };
}

export function createHeroInstance(def: HeroDefinition, ctx: BattleContext): HeroInstance {
  const race = ctx.getRace(def.raceId);
  const cls = ctx.getClass(def.classId);
  const stats = composeHeroStats(def, race, cls);
  return {
    defId: def.id,
    hp: stats.hp,
    maxHp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    cmd: stats.cmd,
    morale: 0,
    gaugeValue: 0,
    armor: 0,
    buffs: [],
    equipment: {},
    flags: { ultimateUsed: false, immortalUsed: false },
  };
}
