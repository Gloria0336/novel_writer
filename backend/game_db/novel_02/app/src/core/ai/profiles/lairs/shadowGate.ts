import type { EnemyProfile } from "../../types";

/** 暗影門戶 — 每 2 回合 1–2 召喚精英；穩定度殺手。 */
export const LAIR_SHADOW_GATE_PROFILE: EnemyProfile = {
  id: "lair_shadow_gate",
  kind: "lair",
  personality: {
    aggression: 0.5,
    calculation: 0.6,
    greed: 0.3,
    cunning: 0.7,
    resilience: 0.4,
    recklessness: 0.2,
  },
  raceBias: {
    stabilityPressure: 1.5,
    boardControl: 0.6,
    gaugeBuildup: -1.0,
  },
  summonPool: ["I_SHADOW_GUARD", "I_SHADOW_ELITE", "I_SHADOW_LORD"],
  summonsPerTurn: { min: 1, max: 2 },
  summonCadenceTurns: 2,
};
