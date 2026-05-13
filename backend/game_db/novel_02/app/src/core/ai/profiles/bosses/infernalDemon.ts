import type { EnemyProfile } from "../../types";

/** 炎魔 — 狂戰士型 Boss，與蠻血酋長性格相同。 */
export const BOSS_INFERNAL_DEMON_PROFILE: EnemyProfile = {
  id: "boss_infernal_demon",
  kind: "boss",
  personality: {
    aggression: 0.95,
    calculation: 0.3,
    greed: 0.7,
    cunning: 0.2,
    resilience: 0.2,
    recklessness: 0.8,
  },
  raceBias: {
    heroPressure: 0.6,
    gaugeBuildup: 0.4,
    selfSurvival: -0.5,
  },
  gaugePolicy: {
    saveUntilThreshold: 0.4,
    spendOnUltimateAt: 0.7,
  },
};
