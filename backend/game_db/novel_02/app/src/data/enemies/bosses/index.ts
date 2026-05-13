import type { BossDefinition } from "./types";
import { BOSS_DEMON_COMMANDER } from "./demonCommander";
import { BOSS_NIGHTMARE_LORD } from "./nightmareLord";
import { BOSS_ELDER_DEMON } from "./elderDemon";
import { BOSS_INFERNAL_DEMON } from "./infernalDemon";
import { BOSS_FEY_REBEL_KING } from "./feyRebelKing";
import { BOSS_BEAST_KING } from "./beastKing";

export const BOSS_LIST: BossDefinition[] = [
  BOSS_DEMON_COMMANDER,
  BOSS_NIGHTMARE_LORD,
  BOSS_ELDER_DEMON,
  BOSS_INFERNAL_DEMON,
  BOSS_FEY_REBEL_KING,
  BOSS_BEAST_KING,
];

export const BOSSES: Record<string, BossDefinition> = Object.fromEntries(BOSS_LIST.map((b) => [b.id, b]));

export {
  BOSS_DEMON_COMMANDER,
  BOSS_NIGHTMARE_LORD,
  BOSS_ELDER_DEMON,
  BOSS_INFERNAL_DEMON,
  BOSS_FEY_REBEL_KING,
  BOSS_BEAST_KING,
};
export type { BossDefinition };
