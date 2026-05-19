import type { BattleState, SideState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { Side } from "../types/effect";
import type { Card } from "../types/card";
import type { RaceFrame } from "../types/hero";
import { getSide } from "../selectors/battle";
import { addTempMana } from "./mana";

export const FULL_GAUGE_BUFF_SOURCE = "FULL_GAUGE_BUFF";

function fullGaugeSource(race: RaceFrame): string {
  return `${FULL_GAUGE_BUFF_SOURCE}:${race.fullGaugeBuff.id}`;
}

export function isFullGaugeBuffSource(source: string): boolean {
  return source.startsWith(FULL_GAUGE_BUFF_SOURCE);
}

export function isFullGaugeActive(side: SideState, race: RaceFrame): boolean {
  return side.hero.gaugeValue === race.gauge.max;
}

export function syncFullGaugeBuffs(state: BattleState, ctx: BattleContext): void {
  syncSideFullGaugeBuff(state, ctx, "player");
  syncSideFullGaugeBuff(state, ctx, "enemy");
}

export function syncSideFullGaugeBuff(state: BattleState, ctx: BattleContext, side: Side): void {
  const sideState = getSide(state, side);
  const heroDef = ctx.getHero(sideState.hero.defId);
  const race = ctx.getRace(heroDef.raceId);
  const active = isFullGaugeActive(sideState, race);

  syncTroopAuras(state, side, sideState, race, active);
  syncHeroAuras(sideState, race, active);
}

export function applyFullGaugeTurnStartBonuses(state: BattleState, ctx: BattleContext, side: Side): void {
  syncSideFullGaugeBuff(state, ctx, side);
  const sideState = getSide(state, side);
  const race = ctx.getRace(ctx.getHero(sideState.hero.defId).raceId);
  if (!isFullGaugeActive(sideState, race)) return;

  for (const rule of race.fullGaugeBuff.rules) {
    if (rule.kind === "turnStartTempMana") {
      addTempMana(sideState, rule.amount);
      state.log.push({ turn: state.turn, side, kind: "FULL_GAUGE_BUFF", text: `${race.fullGaugeBuff.name}：本回合 +${rule.amount} 臨時魔力` });
    }
    if (rule.kind === "turnStartTroopHeal") {
      let healed = 0;
      for (const troop of collectSideTroops(state, side, sideState)) {
        const before = troop.hp;
        troop.hp = Math.min(troop.maxHp, troop.hp + rule.amount);
        if (troop.hp > before) healed++;
      }
      if (healed > 0) {
        state.log.push({ turn: state.turn, side, kind: "FULL_GAUGE_BUFF", text: `${race.fullGaugeBuff.name}：${healed} 個兵力回復 ${rule.amount} HP` });
      }
    }
  }
}

export function getEffectiveCardCost(state: BattleState, ctx: BattleContext, side: Side, card: Card): number {
  const sideState = getSide(state, side);
  const heroDef = ctx.getHero(sideState.hero.defId);
  const race = ctx.getRace(heroDef.raceId);
  let cost = card.cost;

  if (isFullGaugeActive(sideState, race)) {
    for (const rule of race.fullGaugeBuff.rules) {
      if (rule.kind !== "cardCostReduction") continue;
      const applies =
        (card.type === "equipment" && rule.cardTypes.includes("equipment")) ||
        (isDeviceCard(card) && rule.cardTypes.includes("device"));
      if (applies) cost = Math.max(rule.minCost, cost - rule.amount);
    }
  }

  return cost;
}

export function getFullGaugeSpellEffectMultiplier(state: BattleState, ctx: BattleContext, side: Side): number {
  const sideState = getSide(state, side);
  const race = ctx.getRace(ctx.getHero(sideState.hero.defId).raceId);
  if (!isFullGaugeActive(sideState, race)) return 1;

  let multiplier = 1;
  for (const rule of race.fullGaugeBuff.rules) {
    if (rule.kind === "feyForm" && sideState.hero.flags.feyForm !== "fey") {
      multiplier *= 1 + rule.humanSpellEffectPct / 100;
    }
  }
  return multiplier;
}

export function getFullGaugeActionDamageMultiplier(state: BattleState, ctx: BattleContext, side: Side): number {
  const sideState = getSide(state, side);
  const race = ctx.getRace(ctx.getHero(sideState.hero.defId).raceId);
  if (!isFullGaugeActive(sideState, race)) return 1;

  let multiplier = 1;
  for (const rule of race.fullGaugeBuff.rules) {
    if (rule.kind === "actionDamagePct") multiplier *= 1 + rule.pct / 100;
    if (rule.kind === "feyForm" && sideState.hero.flags.feyForm === "fey") multiplier *= 1 + rule.feyActionDamagePct / 100;
  }
  return multiplier;
}

export function getFullGaugeTroopDamageMultiplier(state: BattleState, ctx: BattleContext, side: Side): number {
  const sideState = getSide(state, side);
  const race = ctx.getRace(ctx.getHero(sideState.hero.defId).raceId);
  if (!isFullGaugeActive(sideState, race)) return 1;

  let multiplier = 1;
  for (const rule of race.fullGaugeBuff.rules) {
    if (rule.kind === "troopDamagePct") multiplier *= 1 + rule.pct / 100;
    if (rule.kind === "feyForm" && sideState.hero.flags.feyForm === "fey") multiplier *= 1 + rule.feyAttackDamagePct / 100;
  }
  return multiplier;
}

export function getFullGaugeHeroDamageTakenMultiplier(state: BattleState, ctx: BattleContext, side: Side): number {
  const sideState = getSide(state, side);
  const race = ctx.getRace(ctx.getHero(sideState.hero.defId).raceId);
  if (!isFullGaugeActive(sideState, race)) return 1;

  let multiplier = 1;
  for (const rule of race.fullGaugeBuff.rules) {
    if (rule.kind === "heroDamageTakenPct") multiplier *= 1 + rule.pct / 100;
  }
  return multiplier;
}

export function maybeHealHeroFromFullGaugeTroopKill(state: BattleState, ctx: BattleContext, side: Side): void {
  const sideState = getSide(state, side);
  const race = ctx.getRace(ctx.getHero(sideState.hero.defId).raceId);
  if (!isFullGaugeActive(sideState, race)) return;

  for (const rule of race.fullGaugeBuff.rules) {
    if (rule.kind !== "healHeroOnKillTroop") continue;
    const before = sideState.hero.hp;
    sideState.hero.hp = Math.min(sideState.hero.maxHp, sideState.hero.hp + rule.amount);
    if (sideState.hero.hp > before) {
      state.log.push({ turn: state.turn, side, kind: "FULL_GAUGE_BUFF", text: `${race.fullGaugeBuff.name}：英雄回復 ${sideState.hero.hp - before} HP` });
    }
  }
}

export function fullGaugeOpportunityCost(state: BattleState, ctx: BattleContext, side: Side, gaugeCost: number | undefined): number {
  if (!gaugeCost || gaugeCost <= 0) return 0;
  const sideState = getSide(state, side);
  const race = ctx.getRace(ctx.getHero(sideState.hero.defId).raceId);
  return isFullGaugeActive(sideState, race) ? Math.ceil(race.gauge.max * 0.25) : 0;
}

export function isDeviceCard(card: Card): boolean {
  return card.type === "device";
}

function syncTroopAuras(state: BattleState, side: Side, sideState: SideState, race: RaceFrame, active: boolean): void {
  for (const troop of collectSideTroops(state, side, sideState)) {
    const desiredMod = active ? getTroopAuraMod(troop, race) : {};
    syncTroopBuff(troop, race, desiredMod);
  }
}

function syncHeroAuras(sideState: SideState, race: RaceFrame, active: boolean): void {
  const desiredDef = active ? getHeroDefAura(sideState, race) : 0;
  syncHeroBuff(sideState, race, desiredDef ? { def: desiredDef } : {});
}

function getTroopAuraMod(troop: TroopInstance, race: RaceFrame): { atk?: number; def?: number } {
  const mod: { atk?: number; def?: number } = {};
  for (const rule of race.fullGaugeBuff.rules) {
    if (rule.kind === "troopAura") {
      if (rule.atk) mod.atk = (mod.atk ?? 0) + rule.atk;
      if (rule.def) mod.def = (mod.def ?? 0) + rule.def;
    }
    if (rule.kind === "deviceAura" && isDeviceTroop(troop)) {
      if (rule.def) mod.def = (mod.def ?? 0) + rule.def;
    }
  }
  return mod;
}

function getHeroDefAura(sideState: SideState, race: RaceFrame): number {
  let def = 0;
  for (const rule of race.fullGaugeBuff.rules) {
    if (rule.kind === "feyForm" && sideState.hero.flags.feyForm === "fey") def += rule.feyDef;
  }
  return def;
}

function syncTroopBuff(troop: TroopInstance, race: RaceFrame, mod: { atk?: number; def?: number }): void {
  const source = fullGaugeSource(race);
  const idx = troop.buffs.findIndex((b) => b.source === source);
  const current = idx >= 0 ? troop.buffs[idx] : undefined;
  if (current) {
    troop.atk = Math.max(0, troop.atk - (current.mod.atk ?? 0));
    troop.def = Math.max(0, troop.def - (current.mod.def ?? 0));
    troop.buffs.splice(idx, 1);
  }
  if (!mod.atk && !mod.def) return;
  troop.atk += mod.atk ?? 0;
  troop.def += mod.def ?? 0;
  troop.buffs.push({ id: `full_gauge_${race.id}_${troop.instanceId}`, source, mod, remainingTurns: Number.MAX_SAFE_INTEGER });
}

function syncHeroBuff(sideState: SideState, race: RaceFrame, mod: { def?: number }): void {
  const source = fullGaugeSource(race);
  const idx = sideState.hero.buffs.findIndex((b) => b.source === source);
  const current = idx >= 0 ? sideState.hero.buffs[idx] : undefined;
  if (current) {
    sideState.hero.def = Math.max(0, sideState.hero.def - (current.mod.def ?? 0));
    sideState.hero.buffs.splice(idx, 1);
  }
  if (!mod.def) return;
  sideState.hero.def += mod.def;
  sideState.hero.buffs.push({ id: `full_gauge_${race.id}_hero`, source, mod, remainingTurns: Number.MAX_SAFE_INTEGER });
}

function collectSideTroops(state: BattleState, side: Side, sideState: SideState): TroopInstance[] {
  const troops = sideState.troopSlots.filter((t): t is TroopInstance => t !== null);
  if (state.rift?.occupant && state.rift.holder === side) troops.push(state.rift.occupant);
  return troops;
}

function isDeviceTroop(troop: TroopInstance): boolean {
  return troop.isDevice === true;
}
