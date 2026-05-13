import type { EnemyProfile } from "../../types";

/** 晶體礦脈 — 每 3 回合 1 召喚；防禦型。 */
export const LAIR_CRYSTAL_VEIN_PROFILE: EnemyProfile = {
  id: "lair_crystal_vein",
  kind: "lair",
  personality: {
    aggression: 0.3,
    calculation: 0.5,
    greed: 0.4,
    cunning: 0.2,
    resilience: 0.8,
    recklessness: 0.1,
  },
  raceBias: {
    boardControl: 0.8,
    selfSurvival: 0.6,
    gaugeBuildup: -1.0,
  },
  summonPool: ["I_CRYSTAL_SHARD", "I_CRYSTAL_GUARD"],
  summonsPerTurn: { min: 1, max: 1 },
  summonCadenceTurns: 3,
};
