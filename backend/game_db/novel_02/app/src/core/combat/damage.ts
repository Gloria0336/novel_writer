import type { BattleState, TroopInstance } from "../types/battle";
import type { Side } from "../types/effect";
import type { HeroInstance } from "../types/hero";

export interface DamageOptions {
  ignoreDef?: boolean;
  ignorePierce?: boolean;
  fixed?: boolean;
  source?: { kind: "hero" | "troop"; side: Side; instanceId?: string };
}

export interface DamageResult {
  finalAmount: number;
  killed: boolean;
}

/**
 * Calculate damage to a troop instance, mutating its hp and armor (caller must guard).
 * Returns the damage actually dealt (after DEF/armor) and whether it was killed.
 */
export function applyTroopDamage(troop: TroopInstance, raw: number, opts: DamageOptions = {}): DamageResult {
  let amount = raw;
  if (!opts.fixed && !opts.ignoreDef) {
    amount = Math.max(0, amount - troop.def);
  }
  troop.hp = Math.max(0, troop.hp - amount);
  return { finalAmount: amount, killed: troop.hp <= 0 };
}

export function applyHeroDamage(hero: HeroInstance, raw: number, opts: DamageOptions = {}): DamageResult {
  let amount = raw;
  if (!opts.fixed) {
    if (!opts.ignoreDef) amount = Math.max(0, amount - hero.def);
    if (hero.armor > 0) {
      const absorbed = Math.min(hero.armor, amount);
      hero.armor -= absorbed;
      amount -= absorbed;
    }
  }
  hero.hp = Math.max(0, hero.hp - amount);
  return { finalAmount: amount, killed: hero.hp <= 0 };
}

/** Apply lifesteal: heal source hero by lifestealPct% of damage dealt. */
export function applyLifesteal(state: BattleState, sourceSide: Side, damageDealt: number, lifestealPct: number): void {
  if (lifestealPct <= 0 || damageDealt <= 0) return;
  const heal = Math.floor(damageDealt * (lifestealPct / 100));
  const hero = sourceSide === "player" ? state.player.hero : state.enemy.hero;
  hero.hp = Math.min(hero.maxHp, hero.hp + heal);
}
