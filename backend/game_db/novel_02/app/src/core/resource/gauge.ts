import type { GaugePersonalization, HeroInstance } from "../types/hero";

export function addGauge(hero: HeroInstance, max: number, delta: number): void {
  hero.gaugeValue = Math.max(0, Math.min(max, hero.gaugeValue + delta));
}

export function spendGauge(hero: HeroInstance, cost: number): boolean {
  if (hero.gaugeValue < cost) return false;
  hero.gaugeValue -= cost;
  return true;
}

/**
 * 套用「英雄受傷」對血怒類量表的影響。
 * 規則：每損失 perPct% 最大 HP +perValue 層。
 * 計算方式：以新 HP 跨過閾值的次數計算。
 */
export function gaugeOnHeroDamaged(
  hero: HeroInstance,
  max: number,
  config: { perPct: number; perValue: number },
  previousHp: number,
  newHp: number,
): void {
  if (config.perPct <= 0 || config.perValue <= 0) return;
  const stepHp = (hero.maxHp * config.perPct) / 100;
  if (stepHp <= 0) return;
  const prevSteps = Math.floor((hero.maxHp - previousHp) / stepHp);
  const newSteps = Math.floor((hero.maxHp - newHp) / stepHp);
  const stepsCrossed = Math.max(0, newSteps - prevSteps);
  if (stepsCrossed > 0) addGauge(hero, max, stepsCrossed * config.perValue);
}

/**
 * 觸發於：兵力進入戰場
 */
export function gaugeOnTroopEnter(hero: HeroInstance, max: number, gauge: GaugePersonalization): void {
  if (gauge.onTroopEnter) addGauge(hero, max, gauge.onTroopEnter);
}

export function gaugeOnSpellCast(hero: HeroInstance, max: number, gauge: GaugePersonalization): void {
  if (gauge.onSpellCast) addGauge(hero, max, gauge.onSpellCast);
}

export function gaugeOnTroopDestroyedSelf(hero: HeroInstance, max: number, gauge: GaugePersonalization): void {
  if (gauge.onTroopDestroyedSelf) addGauge(hero, max, gauge.onTroopDestroyedSelf);
}

export function gaugeOnTroopSurvivePerTurn(hero: HeroInstance, max: number, gauge: GaugePersonalization, count: number): void {
  if (gauge.onTroopSurvivePerTurn && count > 0) addGauge(hero, max, gauge.onTroopSurvivePerTurn * count);
}

export function gaugeOnEquipmentPlay(hero: HeroInstance, max: number, gauge: GaugePersonalization): void {
  if (gauge.onEquipmentPlay) addGauge(hero, max, gauge.onEquipmentPlay);
}

export function gaugeOnTurnStart(hero: HeroInstance, max: number, gauge: GaugePersonalization): void {
  if (gauge.onTurnStart) addGauge(hero, max, gauge.onTurnStart);
}
