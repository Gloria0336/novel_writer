import type { HeroDefinition } from "../../core/types/hero";
import { HERO_LULU } from "./lulu";
import { HERO_MOUNTAIN_HUNTER } from "./mountainHunter";
import { HERO_REKA } from "./reka";
import { HERO_ELNO_HONORARY_MAGE } from "./elnoHonoraryMage";

export const HEROES: Record<string, HeroDefinition> = {
  [HERO_LULU.id]: HERO_LULU,
  [HERO_MOUNTAIN_HUNTER.id]: HERO_MOUNTAIN_HUNTER,
  [HERO_REKA.id]: HERO_REKA,
  [HERO_ELNO_HONORARY_MAGE.id]: HERO_ELNO_HONORARY_MAGE,
};

export const HERO_LIST: HeroDefinition[] = [HERO_LULU, HERO_MOUNTAIN_HUNTER, HERO_REKA, HERO_ELNO_HONORARY_MAGE];

export { HERO_LULU, HERO_MOUNTAIN_HUNTER, HERO_REKA, HERO_ELNO_HONORARY_MAGE };
