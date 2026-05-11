import { useMemo } from "react";
import { HERO_LIST } from "../data/heroes";
import { getRace } from "../data/races";
import { getClass } from "../data/classes";
import { composeHeroStats } from "../core/stats/compose";
import type { Stats } from "../core/types/hero";

export interface HeroDisplay {
  id: string;
  name: string;
  raceName: string;
  className: string;
  rarity: string;
  stats: Stats;
  flavor: string;
}

export function useBattleData(): HeroDisplay[] {
  return useMemo(
    () =>
      HERO_LIST.map((h) => {
        const race = getRace(h.raceId);
        const cls = getClass(h.classId);
        return {
          id: h.id,
          name: h.name,
          raceName: race.name,
          className: cls.name,
          rarity: h.rarity,
          stats: composeHeroStats(h, race, cls),
          flavor: h.flavor ?? "",
        };
      }),
    [],
  );
}
