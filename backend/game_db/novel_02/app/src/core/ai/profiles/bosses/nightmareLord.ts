import type { EnemyProfile } from "../../types";

/** 夢魔宗主 — 幻術型 Boss，靠召喚池吐出威壓夢幻體。 */
export const BOSS_NIGHTMARE_LORD_PROFILE: EnemyProfile = {
  id: "boss_nightmare_lord",
  kind: "boss",
  personality: {
    aggression: 0.4,
    calculation: 0.7,
    greed: 0.4,
    cunning: 0.8,
    resilience: 0.5,
    recklessness: 0.2,
  },
  raceBias: {
    boardControl: 0.6,
    stabilityPressure: 0.3,
  },
  gaugePolicy: {
    saveUntilThreshold: 0.5,
    spendOnUltimateAt: 0.7,
  },
  summonPool: ["I_PHANTOM_AWE"],
  summonsPerTurn: { min: 0, max: 1 },
};
