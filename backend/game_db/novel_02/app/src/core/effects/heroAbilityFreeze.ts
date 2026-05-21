import type { HeroInstance } from "../types/hero";
import type { FreezeEffectName, HeroAbilityFreezeKind } from "../types/effect";

export const HERO_ABILITY_FREEZE_LABEL: Record<HeroAbilityFreezeKind, string> = {
  action: "行動牌",
  spell: "法術牌",
  troop: "兵力牌/巢穴生成",
  manaRegen: "魔力回復",
};

export function addHeroAbilityFreeze(
  hero: HeroInstance,
  modes: readonly HeroAbilityFreezeKind[],
  turns: number,
  displayName: FreezeEffectName = "封鎖",
): void {
  if (turns <= 0 || modes.length === 0) return;
  const state = hero.flags.heroAbilityFreeze ?? {};
  const displayNames = hero.flags.heroAbilityFreezeDisplayNames ?? {};
  for (const mode of modes) {
    const prev = state[mode] ?? 0;
    state[mode] = Math.max(prev, turns);
    if (turns >= prev) displayNames[mode] = displayName;
  }
  hero.flags.heroAbilityFreeze = state;
  hero.flags.heroAbilityFreezeDisplayNames = displayNames;
}

export function isHeroAbilityFrozen(hero: HeroInstance, mode: HeroAbilityFreezeKind): boolean {
  return (hero.flags.heroAbilityFreeze?.[mode] ?? 0) > 0;
}

export function tickHeroAbilityFreezes(hero: HeroInstance): void {
  const state = hero.flags.heroAbilityFreeze;
  if (!state) return;

  for (const mode of Object.keys(state) as HeroAbilityFreezeKind[]) {
    const next = (state[mode] ?? 0) - 1;
    if (next > 0) state[mode] = next;
    else {
      delete state[mode];
      delete hero.flags.heroAbilityFreezeDisplayNames?.[mode];
    }
  }

  if (Object.keys(state).length === 0) {
    delete hero.flags.heroAbilityFreeze;
    delete hero.flags.heroAbilityFreezeDisplayNames;
  }
}
