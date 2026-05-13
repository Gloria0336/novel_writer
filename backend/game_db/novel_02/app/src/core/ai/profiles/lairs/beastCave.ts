import type { EnemyProfile } from "../../types";

/** 魔獸洞穴 — 每 2 回合 1 召喚；半血爆發。 */
export const LAIR_BEAST_CAVE_PROFILE: EnemyProfile = {
  id: "lair_beast_cave",
  kind: "lair",
  personality: {
    aggression: 0.8,
    calculation: 0.3,
    greed: 0.2,
    cunning: 0.3,
    resilience: 0.5,
    recklessness: 0.5,
  },
  raceBias: {
    heroPressure: 0.6,
    boardControl: 0.4,
    gaugeBuildup: -1.0,
  },
  summonPool: ["I_FERAL_BEAST", "I_DIRE_HOUND", "I_ALPHA_BEAST"],
  summonsPerTurn: { min: 1, max: 1 },
  summonCadenceTurns: 2,
};
