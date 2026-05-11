import type { ClassFrame, HeroDefinition, RaceFrame, Stats } from "../types/hero";

export const BASE_STATS: Stats = {
  hp: 80,
  atk: 10,
  def: 5,
  cmd: 5,
};

const STAT_BOUNDS = {
  hp: { min: 1, max: 200 },
  atk: { min: 0, max: 30 },
  def: { min: 1, max: 15 },
  cmd: { min: 0, max: 11 },
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function composeHeroStats(
  hero: HeroDefinition,
  race: RaceFrame,
  cls: ClassFrame,
): Stats {
  if (race.id !== hero.raceId) {
    throw new Error(`Race mismatch: hero ${hero.id} expects ${hero.raceId}, got ${race.id}`);
  }
  if (cls.id !== hero.classId) {
    throw new Error(`Class mismatch: hero ${hero.id} expects ${hero.classId}, got ${cls.id}`);
  }

  const tuning = hero.statTuning;

  const raw = {
    hp: BASE_STATS.hp + race.statMods.hp + cls.statMods.hp + (tuning.hp ?? 0),
    atk: BASE_STATS.atk + race.statMods.atk + cls.statMods.atk + (tuning.atk ?? 0),
    def: BASE_STATS.def + race.statMods.def + cls.statMods.def + (tuning.def ?? 0),
    cmd: BASE_STATS.cmd + race.statMods.cmd + cls.statMods.cmd + (tuning.cmd ?? 0),
  };

  return {
    hp: clamp(raw.hp, STAT_BOUNDS.hp.min, STAT_BOUNDS.hp.max),
    atk: clamp(raw.atk, STAT_BOUNDS.atk.min, STAT_BOUNDS.atk.max),
    def: clamp(raw.def, STAT_BOUNDS.def.min, STAT_BOUNDS.def.max),
    cmd: clamp(raw.cmd, STAT_BOUNDS.cmd.min, STAT_BOUNDS.cmd.max),
  };
}

export function manaCapFor(race: RaceFrame, turn: number): number {
  const absolute = race.manaCap ?? 10;
  return Math.min(turn, absolute);
}
