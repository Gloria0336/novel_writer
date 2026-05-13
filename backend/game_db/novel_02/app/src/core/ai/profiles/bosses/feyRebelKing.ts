import type { EnemyProfile } from "../../types";

/** 妖族叛王 — 形態切換 + 幻影群襲。 */
export const BOSS_FEY_REBEL_KING_PROFILE: EnemyProfile = {
  id: "boss_fey_rebel_king",
  kind: "boss",
  personality: {
    aggression: 0.7,
    calculation: 0.6,
    greed: 0.5,
    cunning: 0.7,
    resilience: 0.5,
    recklessness: 0.4,
  },
  raceBias: {
    gaugeBuildup: 0.6,
    boardControl: 0.4,
    heroPressure: 0.3,
  },
  gaugePolicy: {
    saveUntilThreshold: 0.4,
    spendOnUltimateAt: 0.7,
  },
};
