import type { HeroDefinition } from "../../core/types/hero";
import { HERO_LULU } from "./lulu";
import { HERO_MOUNTAIN_HUNTER } from "./mountainHunter";
import { HERO_REKA } from "./reka";
import { HERO_ELNO_HONORARY_MAGE } from "./elnoHonoraryMage";
import { HERO_BUTTERFLY_YAO } from "./butterflyYao";
import { HERO_ELDR_THORIN } from "./eldrThorin";
import { HERO_AELLA_FLAIR } from "./aellaFlair";
import { HERO_FULDRA } from "./fuldra";

export const HEROES: Record<string, HeroDefinition> = {
  [HERO_LULU.id]: HERO_LULU,
  [HERO_MOUNTAIN_HUNTER.id]: HERO_MOUNTAIN_HUNTER,
  [HERO_REKA.id]: HERO_REKA,
  [HERO_ELNO_HONORARY_MAGE.id]: HERO_ELNO_HONORARY_MAGE,
  [HERO_BUTTERFLY_YAO.id]: HERO_BUTTERFLY_YAO,
  [HERO_ELDR_THORIN.id]: HERO_ELDR_THORIN,
  [HERO_AELLA_FLAIR.id]: HERO_AELLA_FLAIR,
  [HERO_FULDRA.id]: HERO_FULDRA,
};

export const HERO_LIST: HeroDefinition[] = [HERO_LULU, HERO_MOUNTAIN_HUNTER, HERO_REKA, HERO_ELNO_HONORARY_MAGE, HERO_BUTTERFLY_YAO, HERO_ELDR_THORIN, HERO_AELLA_FLAIR, HERO_FULDRA];

export { HERO_LULU, HERO_MOUNTAIN_HUNTER, HERO_REKA, HERO_ELNO_HONORARY_MAGE, HERO_BUTTERFLY_YAO, HERO_ELDR_THORIN, HERO_AELLA_FLAIR, HERO_FULDRA };
