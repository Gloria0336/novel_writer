import type { EnemyProfile } from "../types";

/**
 * 腐植巢穴：召喚狂、穩定度殺手。
 * 不算計、不貪量表（巢穴沒有量表系統）、偶爾莽撞變化召喚池。
 */
export const PUTREFACTIVE_LAIR_PROFILE: EnemyProfile = {
  id: "lair_putrefactive",
  kind: "lair",
  personality: {
    aggression: 0.5,
    calculation: 0.2,
    greed: 0.0,
    cunning: 0.5,
    resilience: 0.3,
    recklessness: 0.4,
  },
  raceBias: {
    stabilityPressure: 1.5,
    gaugeBuildup: -1.0,
  },
  summonPool: ["L01", "L02", "L03"],
  summonsPerTurn: { min: 1, max: 1 },
};
