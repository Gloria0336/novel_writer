import type { EnemyProfile } from "../../types";

/** 惡魔將領 — 指揮型 Boss，召喚暗影兵壓制穩定度。 */
export const BOSS_DEMON_COMMANDER_PROFILE: EnemyProfile = {
  id: "boss_demon_commander",
  kind: "boss",
  personality: {
    aggression: 0.6,
    calculation: 0.7,
    greed: 0.5,
    cunning: 0.4,
    resilience: 0.5,
    recklessness: 0.3,
  },
  raceBias: {
    heroPressure: 0.5,
    stabilityPressure: 0.8,
    boardControl: 0.4,
  },
  gaugePolicy: {
    saveUntilThreshold: 0.4,
    spendOnUltimateAt: 0.7,
  },
};
