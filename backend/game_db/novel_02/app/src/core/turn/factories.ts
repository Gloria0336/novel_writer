import type { BattleState, TroopInstance } from "../types/battle";
import type { BoardUnitCard } from "../types/card";
import type { HeroDefinition, HeroInstance } from "../types/hero";
import { composeHeroStats } from "../stats/compose";
import type { BattleContext } from "../types/context";

export function nextInstanceId(state: BattleState, prefix = "i"): string {
  state.nextInstanceId++;
  return `${prefix}${state.nextInstanceId}`;
}

export function createTroopInstance(state: BattleState, card: BoardUnitCard, opts?: { suppressSummonSickness?: boolean }): TroopInstance {
  const isDevice = card.type === "device";
  const baseForm = isDevice && card.form ? card.form.idle : null;
  const hp = baseForm?.hp ?? card.hp;
  const atk = baseForm?.atk ?? card.atk;
  const def = baseForm?.def ?? card.def;
  const keywords = baseForm?.keywords ? new Set(baseForm.keywords) : new Set(card.keywords);

  const inst: TroopInstance = {
    instanceId: nextInstanceId(state, "t"),
    cardId: card.id,
    hp,
    maxHp: hp,
    atk,
    def,
    keywords,
    hasAttackedThisTurn: false,
    summonedThisTurn: !opts?.suppressSummonSickness,
    frozenTurns: 0,
    buffs: [],
    keywordBuffs: [],
    statusBuffs: [],
  };
  if (isDevice) {
    inst.isDevice = true;
    if (card.form) inst.deviceForm = "idle";
    if (card.upgradeable) inst.upgradeLevel = 0;
  }
  return inst;
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
    statusBuffs: [],
    equipment: {},
    flags: {
      ultimateUsed: false,
      immortalUsed: false,
      ...(def.raceId === "fey" ? { feyForm: "human" as const } : {}),
    },
  };
}
