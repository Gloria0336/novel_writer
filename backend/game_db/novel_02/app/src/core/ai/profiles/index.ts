import type { EnemyProfile } from "../types";
import { PUTREFACTIVE_LAIR_PROFILE } from "./lairPutrefactive";
import { BOSS_BLOOD_CHIEF_PROFILE } from "./bossBloodChief";

export const ENEMY_PROFILES: Record<string, EnemyProfile> = {
  [PUTREFACTIVE_LAIR_PROFILE.id]: PUTREFACTIVE_LAIR_PROFILE,
  [BOSS_BLOOD_CHIEF_PROFILE.id]: BOSS_BLOOD_CHIEF_PROFILE,
};

export { PUTREFACTIVE_LAIR_PROFILE, BOSS_BLOOD_CHIEF_PROFILE };
