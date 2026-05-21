import type { EnemyProfile } from "../../types";

/** 腐化神殿 — 每 2 回合 1 召喚；祭司存活時自癒。 */
export const LAIR_CORRUPTED_TEMPLE_PROFILE: EnemyProfile = {
  id: "lair_corrupted_temple",
  kind: "lair",
  personality: {
    aggression: 0.4,
    calculation: 0.7,
    greed: 0.5,
    cunning: 0.5,
    resilience: 0.7,
    recklessness: 0.2,
  },
  raceBias: {
    boardControl: 0.6,
    selfSurvival: 0.6,
    stabilityPressure: 0.4,
    gaugeBuildup: -1.0,
  },
  summonPool: ["T_s_24", "T_s_25", "T_s_26"],
  summonsPerTurn: { min: 1, max: 1 },
  summonCadenceTurns: 2,
};
