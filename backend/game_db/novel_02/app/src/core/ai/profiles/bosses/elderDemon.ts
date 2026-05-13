import type { EnemyProfile } from "../../types";

/** 古魔 — 法師型 Boss，靠長期累積與兵力觸碰摧毀穩定度。 */
export const BOSS_ELDER_DEMON_PROFILE: EnemyProfile = {
  id: "boss_elder_demon",
  kind: "boss",
  personality: {
    aggression: 0.4,
    calculation: 0.9,
    greed: 0.6,
    cunning: 0.5,
    resilience: 0.6,
    recklessness: 0.1,
  },
  raceBias: {
    gaugeBuildup: 0.4,
    stabilityPressure: 0.6,
    boardControl: 0.3,
  },
  gaugePolicy: {
    saveUntilThreshold: 0.5,
    spendOnUltimateAt: 0.8,
  },
  summonPool: ["I_ELDER_SPAWN", "I_ELDER_HORROR"],
  summonsPerTurn: { min: 0, max: 1 },
};
