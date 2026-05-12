import type { ConsiderationId, Personality, Weights } from "./types";
import { ALL_CONSIDERATIONS } from "./types";

/**
 * 將 0~1 的六軸性格轉換為 8 個 consideration 的權重。
 * 公式刻意保留 baseline，避免某項權重歸零導致引擎完全忽略該因子。
 */
export function computeWeights(p: Personality): Weights {
  return {
    damageDealt:        0.5 + 0.5 * p.aggression,
    lethalThisAction:   0.3 + 1.2 * p.calculation,
    boardControl:       0.4 + 0.6 * p.cunning,
    heroPressure:       Math.max(0, 0.3 + 0.7 * p.aggression - 0.2 * p.cunning),
    selfSurvival:       Math.max(0, 0.2 + 0.8 * p.resilience - 0.4 * p.recklessness),
    resourceEfficiency: 0.3 + 0.4 * p.calculation,
    gaugeBuildup:       0.2 + 0.8 * p.greed,
    stabilityPressure:  0.2,
  };
}

export function applyRaceBias(weights: Weights, bias?: Partial<Record<ConsiderationId, number>>): Weights {
  if (!bias) return weights;
  const out = { ...weights };
  for (const id of ALL_CONSIDERATIONS) {
    const b = bias[id];
    if (b !== undefined) {
      out[id] = Math.max(0, weights[id] * (1 + b));
    }
  }
  return out;
}
