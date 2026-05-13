/**
 * @deprecated 自 §E.2 多巢穴系統引入後，請改用 `./lairs/putrefactive` 或 `./index` (getEnemy)。
 * 本檔僅為向後相容的薄包裝。
 */
import { LAIR_PUTREFACTIVE, LAIR_PUTREFACTIVE_ID, LAIR_PUTREFACTIVE_TROOPS } from "./lairs/putrefactive";

export const LAIR_HERO_ID = LAIR_PUTREFACTIVE_ID;
export const LAIR_HERO_DEF = LAIR_PUTREFACTIVE.heroDef;
export const createLairHeroInstance = LAIR_PUTREFACTIVE.createInstance;
export const LAIR_TROOPS = LAIR_PUTREFACTIVE_TROOPS;
