import type { HeroInstance } from "../types/hero";

export const MORALE_MAX = 100;

export const MORALE_KILL_TROOP = 15;
export const MORALE_ACTION_HIT = 10;
export const MORALE_ALLY_TROOP_DESTROYED = 5;

export function addMorale(hero: HeroInstance, delta: number): void {
  hero.morale = Math.max(0, Math.min(MORALE_MAX, hero.morale + delta));
}

export function spendMorale(hero: HeroInstance, cost: number): boolean {
  if (hero.morale < cost) return false;
  hero.morale -= cost;
  return true;
}

export function canAffordMorale(hero: HeroInstance, cost: number): boolean {
  return hero.morale >= cost;
}
