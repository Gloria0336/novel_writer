import type { EnemyProfile } from "../../types";

/** 蟲族窩巢 — 每回合 2 召喚、追求合併蟲后。 */
export const LAIR_INSECT_HIVE_PROFILE: EnemyProfile = {
  id: "lair_insect_hive",
  kind: "lair",
  personality: {
    aggression: 0.6,
    calculation: 0.3,
    greed: 0.0,
    cunning: 0.4,
    resilience: 0.3,
    recklessness: 0.4,
  },
  raceBias: {
    stabilityPressure: 1.0,
    boardControl: 1.2,
    gaugeBuildup: -1.0,
  },
  summonPool: ["I_INSECT_EGG", "I_WORKER_BUG", "I_QUEEN_LARVA"],
  summonsPerTurn: { min: 2, max: 2 },
  summonCadenceTurns: 1,
};
