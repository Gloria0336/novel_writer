import type { BattleState, SideState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { Side } from "../types/effect";
import type { Card } from "../types/card";
import type { RaceFrame } from "../types/hero";
import { getFieldOf, getSide } from "../selectors/battle";
import { applyOmenSpellCostModifier, omenMakesFieldFree } from "../effects/omenHooks";
import { addTempMana } from "./mana";
import { getTurnFlags } from "../turn/turnFlags";

export const GAUGE_SCALING_BUFF_SOURCE = "GAUGE_SCALING_BUFF";

function gaugeScalingSource(race: RaceFrame): string {
  return `${GAUGE_SCALING_BUFF_SOURCE}:${race.gaugeScalingBuff.id}`;
}

export function isGaugeScalingBuffSource(source: string): boolean {
  return source.startsWith(GAUGE_SCALING_BUFF_SOURCE);
}

export function getEffectiveGaugeMax(side: SideState, race: RaceFrame): number {
  const bonus = side.hero.flags.essenceMaxBonus as number | undefined;
  return race.gauge.max + (typeof bonus === "number" ? bonus : 0);
}

export function isGaugeScalingCapped(side: SideState, race: RaceFrame): boolean {
  return side.hero.gaugeValue >= getEffectiveGaugeMax(side, race);
}

export function hasGaugeScalingValue(side: SideState): boolean {
  return side.hero.gaugeValue > 0;
}

export function getGaugeScalingTier(side: SideState, race: RaceFrame): number {
  const step = race.gauge.max <= 10 ? 1 : 10;
  return Math.max(0, Math.floor(side.hero.gaugeValue / step));
}

export function syncGaugeScalingBuffs(state: BattleState, ctx: BattleContext): void {
  syncSideGaugeScalingBuff(state, ctx, "player");
  syncSideGaugeScalingBuff(state, ctx, "enemy");
}

export function syncSideGaugeScalingBuff(state: BattleState, ctx: BattleContext, side: Side): void {
  const sideState = getSide(state, side);
  const heroDef = ctx.getHero(sideState.hero.defId);
  const race = ctx.getRace(heroDef.raceId);

  syncTroopAuras(state, side, sideState, race);
  syncHeroAuras(sideState, race);
}

export function applyGaugeScalingTurnStartBonuses(state: BattleState, ctx: BattleContext, side: Side): void {
  syncSideGaugeScalingBuff(state, ctx, side);
  const sideState = getSide(state, side);
  const race = ctx.getRace(ctx.getHero(sideState.hero.defId).raceId);

  for (const rule of race.gaugeScalingBuff.rules) {
    if (rule.kind === "turnStartTempMana") {
      const amount = scaleIntegerAmount(sideState, race, rule.amount);
      if (amount <= 0) continue;
      addTempMana(sideState, amount);
      state.log.push({ turn: state.turn, side, kind: "GAUGE_SCALING_BUFF", text: `${race.gaugeScalingBuff.name}：本回合 +${amount} 臨時魔力` });
    }
    if (rule.kind === "turnStartTroopHeal") {
      const amount = scaleIntegerAmount(sideState, race, rule.amount);
      if (amount <= 0) continue;
      let healed = 0;
      for (const troop of collectSideTroops(state, side, sideState)) {
        if (troop.isConstruct) continue;
        const before = troop.hp;
        troop.hp = Math.min(troop.maxHp, troop.hp + amount);
        if (troop.hp > before) healed++;
      }
      if (healed > 0) {
        state.log.push({ turn: state.turn, side, kind: "GAUGE_SCALING_BUFF", text: `${race.gaugeScalingBuff.name}：${healed} 個兵力回復 ${amount} HP` });
      }
    }
  }
}

export function getEffectiveCardCost(state: BattleState, ctx: BattleContext, side: Side, card: Card): number {
  const sideState = getSide(state, side);
  const heroDef = ctx.getHero(sideState.hero.defId);
  const race = ctx.getRace(heroDef.raceId);
  let cost = card.cost;

  for (const rule of race.gaugeScalingBuff.rules) {
    if (rule.kind !== "cardCostReduction") continue;
    const amount = scaleIntegerAmount(sideState, race, rule.amount);
    if (amount <= 0) continue;
    const applies =
      (card.type === "equipment" && rule.cardTypes.includes("equipment")) ||
      (isDeviceCard(card) && rule.cardTypes.includes("device"));
    if (applies) cost = Math.max(rule.minCost, cost - amount);
  }

  const flags = getTurnFlags(state);
  if ((card.type === "troop" || card.type === "device") && flags.deployDiscount) {
    cost = Math.max(0, cost - flags.deployDiscount);
  }
  if ((card.type === "troop" || card.type === "device") && flags.nextDeployDiscount) {
    cost = Math.max(0, cost - flags.nextDeployDiscount);
  }
  if (card.type === "equipment" && flags.nextEquipDiscount) {
    cost = Math.max(0, cost - flags.nextEquipDiscount);
  }
  if ((card.type === "troop" || card.type === "device") && getFieldOf(state, side)?.cardId === "F_e_01") {
    cost += 1;
  }
  if (card.type === "equipment" && getFieldOf(state, side)?.cardId === "F_dw_01") {
    cost = Math.max(0, cost - 1);
  }

  // v3.4 天象「副月凌主月」：法術費用 +1。
  if (card.type === "spell") {
    cost = applyOmenSpellCostModifier(state, cost);
  }
  // v3.4 天象「雙月同圓」：場地卡費用視為 0。
  if (card.type === "field" && omenMakesFieldFree(state)) {
    cost = 0;
  }

  return Math.max(0, cost);
}

export function getGaugeScalingSpellEffectMultiplier(state: BattleState, ctx: BattleContext, side: Side): number {
  const sideState = getSide(state, side);
  const race = ctx.getRace(ctx.getHero(sideState.hero.defId).raceId);

  let multiplier = 1;
  for (const rule of race.gaugeScalingBuff.rules) {
    if (rule.kind === "feyForm" && sideState.hero.flags.feyForm !== "fey") {
      multiplier *= 1 + scalePercent(sideState, race, rule.humanSpellEffectPct) / 100;
    }
  }
  return multiplier;
}

export function getGaugeScalingActionDamageMultiplier(state: BattleState, ctx: BattleContext, side: Side): number {
  const sideState = getSide(state, side);
  const race = ctx.getRace(ctx.getHero(sideState.hero.defId).raceId);

  let multiplier = 1;
  for (const rule of race.gaugeScalingBuff.rules) {
    if (rule.kind === "actionDamagePct") multiplier *= 1 + scalePercent(sideState, race, rule.pct) / 100;
    if (rule.kind === "feyForm" && sideState.hero.flags.feyForm === "fey") multiplier *= 1 + scalePercent(sideState, race, rule.feyActionDamagePct) / 100;
  }
  return multiplier;
}

export function getGaugeScalingTroopDamageMultiplier(state: BattleState, ctx: BattleContext, side: Side): number {
  const sideState = getSide(state, side);
  const race = ctx.getRace(ctx.getHero(sideState.hero.defId).raceId);

  let multiplier = 1;
  for (const rule of race.gaugeScalingBuff.rules) {
    if (rule.kind === "troopDamagePct") multiplier *= 1 + scalePercent(sideState, race, rule.pct) / 100;
    if (rule.kind === "feyForm" && sideState.hero.flags.feyForm === "fey") multiplier *= 1 + scalePercent(sideState, race, rule.feyAttackDamagePct) / 100;
  }
  return multiplier;
}

export function getGaugeScalingHeroDamageTakenMultiplier(state: BattleState, ctx: BattleContext, side: Side): number {
  const sideState = getSide(state, side);
  const race = ctx.getRace(ctx.getHero(sideState.hero.defId).raceId);

  let multiplier = 1;
  for (const rule of race.gaugeScalingBuff.rules) {
    if (rule.kind === "heroDamageTakenPct") multiplier *= 1 + scalePercent(sideState, race, rule.pct) / 100;
  }
  return Math.max(0, multiplier);
}

export function maybeHealHeroFromGaugeScalingTroopKill(state: BattleState, ctx: BattleContext, side: Side): void {
  const sideState = getSide(state, side);
  const race = ctx.getRace(ctx.getHero(sideState.hero.defId).raceId);

  for (const rule of race.gaugeScalingBuff.rules) {
    if (rule.kind !== "healHeroOnKillTroop") continue;
    const amount = scaleIntegerAmount(sideState, race, rule.amount);
    if (amount <= 0) continue;
    const before = sideState.hero.hp;
    sideState.hero.hp = Math.min(sideState.hero.maxHp, sideState.hero.hp + amount);
    if (sideState.hero.hp > before) {
      state.log.push({ turn: state.turn, side, kind: "GAUGE_SCALING_BUFF", text: `${race.gaugeScalingBuff.name}：英雄回復 ${sideState.hero.hp - before} HP` });
    }
  }
}

export function gaugeScalingOpportunityCost(state: BattleState, ctx: BattleContext, side: Side, gaugeCost: number | undefined): number {
  if (!gaugeCost || gaugeCost <= 0) return 0;
  const sideState = getSide(state, side);
  const race = ctx.getRace(ctx.getHero(sideState.hero.defId).raceId);
  return isGaugeScalingCapped(sideState, race) ? Math.ceil(getEffectiveGaugeMax(sideState, race) * 0.25) : 0;
}

export function isDeviceCard(card: Card): boolean {
  return card.type === "device";
}

function scaleIntegerAmount(sideState: SideState, race: RaceFrame, amountPerTier: number): number {
  return Math.round(getGaugeScalingTier(sideState, race) * amountPerTier);
}

function scalePercent(sideState: SideState, race: RaceFrame, pctPerTier: number): number {
  return getGaugeScalingTier(sideState, race) * pctPerTier;
}

function syncTroopAuras(state: BattleState, side: Side, sideState: SideState, race: RaceFrame): void {
  for (const troop of collectSideTroops(state, side, sideState)) {
    const desiredMod = getTroopAuraMod(sideState, troop, race);
    syncTroopBuff(troop, race, desiredMod);
  }
}

function syncHeroAuras(sideState: SideState, race: RaceFrame): void {
  const desiredDef = getHeroDefAura(sideState, race);
  syncHeroBuff(sideState, race, desiredDef ? { def: desiredDef } : {});
}

function getTroopAuraMod(sideState: SideState, troop: TroopInstance, race: RaceFrame): { atk?: number; def?: number } {
  const mod: { atk?: number; def?: number } = {};
  for (const rule of race.gaugeScalingBuff.rules) {
    if (rule.kind === "troopAura") {
      const atk = rule.atk ? scaleIntegerAmount(sideState, race, rule.atk) : 0;
      const def = rule.def ? scaleIntegerAmount(sideState, race, rule.def) : 0;
      if (atk) mod.atk = (mod.atk ?? 0) + atk;
      if (def) mod.def = (mod.def ?? 0) + def;
    }
    if (rule.kind === "deviceAura" && isDeviceTroop(troop)) {
      const def = rule.def ? scaleIntegerAmount(sideState, race, rule.def) : 0;
      if (def) mod.def = (mod.def ?? 0) + def;
    }
  }
  return mod;
}

function getHeroDefAura(sideState: SideState, race: RaceFrame): number {
  let def = 0;
  for (const rule of race.gaugeScalingBuff.rules) {
    if (rule.kind === "feyForm" && sideState.hero.flags.feyForm === "fey") {
      def += scaleIntegerAmount(sideState, race, rule.feyDef);
    }
  }
  return def;
}

function syncTroopBuff(troop: TroopInstance, race: RaceFrame, mod: { atk?: number; def?: number }): void {
  const source = gaugeScalingSource(race);
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
  troop.buffs.push({ id: `gauge_scaling_${race.id}_${troop.instanceId}`, source, mod, remainingTurns: Number.MAX_SAFE_INTEGER });
}

function syncHeroBuff(sideState: SideState, race: RaceFrame, mod: { def?: number }): void {
  const source = gaugeScalingSource(race);
  const idx = sideState.hero.buffs.findIndex((b) => b.source === source);
  const current = idx >= 0 ? sideState.hero.buffs[idx] : undefined;
  if (current) {
    sideState.hero.def = Math.max(0, sideState.hero.def - (current.mod.def ?? 0));
    sideState.hero.buffs.splice(idx, 1);
  }
  if (!mod.def) return;
  sideState.hero.def += mod.def;
  sideState.hero.buffs.push({ id: `gauge_scaling_${race.id}_hero`, source, mod, remainingTurns: Number.MAX_SAFE_INTEGER });
}

function collectSideTroops(state: BattleState, side: Side, sideState: SideState): TroopInstance[] {
  const troops = sideState.troopSlots.filter((t): t is TroopInstance => t !== null);
  if (sideState.frontlineSlot) troops.push(sideState.frontlineSlot);
  if (state.rift?.occupant && state.rift.holder === side) troops.push(state.rift.occupant);
  return troops;
}

function isDeviceTroop(troop: TroopInstance): boolean {
  return troop.isDevice === true;
}
