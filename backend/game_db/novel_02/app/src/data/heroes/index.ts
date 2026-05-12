import type { HeroDefinition } from "../../core/types/hero";
import { HERO_COMMANDER } from "./commander";
import { HERO_ARCHMAGE } from "./archmage";
import { HERO_BLOOD_CHIEF } from "./bloodChief";
import { HERO_AELLA_FLAIR } from "./aellaFlair";

export const HEROES: Record<string, HeroDefinition> = {
  [HERO_COMMANDER.id]: HERO_COMMANDER,
  [HERO_ARCHMAGE.id]: HERO_ARCHMAGE,
  [HERO_BLOOD_CHIEF.id]: HERO_BLOOD_CHIEF,
  [HERO_AELLA_FLAIR.id]: HERO_AELLA_FLAIR,
};

export const HERO_LIST: HeroDefinition[] = [HERO_COMMANDER, HERO_ARCHMAGE, HERO_BLOOD_CHIEF, HERO_AELLA_FLAIR];

export { HERO_COMMANDER, HERO_ARCHMAGE, HERO_BLOOD_CHIEF, HERO_AELLA_FLAIR };
