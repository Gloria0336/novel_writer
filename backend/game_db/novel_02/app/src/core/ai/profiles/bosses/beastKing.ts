import type { EnemyProfile } from "../../types";

/** 獸王 — 復刻蠻血酋長性格的 Boss 版。 */
export const BOSS_BEAST_KING_PROFILE: EnemyProfile = {
  id: "boss_beast_king",
  kind: "boss",
  personality: {
    aggression: 0.95,
    calculation: 0.4,
    greed: 0.7,
    cunning: 0.2,
    resilience: 0.2,
    recklessness: 0.7,
  },
  raceBias: {
    heroPressure: 0.5,
    gaugeBuildup: 0.3,
    selfSurvival: -0.5,
  },
  gaugePolicy: {
    saveUntilThreshold: 0.5,
    spendOnUltimateAt: 0.8,
  },
};
