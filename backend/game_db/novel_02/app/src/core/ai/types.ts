/**
 * Utility AI 核心型別。
 * 所有敵人（Boss / 巢穴 / 種族內戰）共用同一份 engine + 不同 EnemyProfile。
 */

export type ConsiderationId =
  | "damageDealt"
  | "lethalThisAction"
  | "boardControl"
  | "heroPressure"
  | "selfSurvival"
  | "resourceEfficiency"
  | "gaugeBuildup"
  | "stabilityPressure";

export const ALL_CONSIDERATIONS: readonly ConsiderationId[] = [
  "damageDealt",
  "lethalThisAction",
  "boardControl",
  "heroPressure",
  "selfSurvival",
  "resourceEfficiency",
  "gaugeBuildup",
  "stabilityPressure",
];

/** 0~1 的六軸性格向量。 */
export interface Personality {
  aggression: number;
  calculation: number;
  greed: number;
  cunning: number;
  resilience: number;
  recklessness: number;
}

export interface GaugePolicy {
  /** 量表比例低於此值時，主動技 cost.gauge>0 的 utility 衰減為 0.5。 */
  saveUntilThreshold?: number;
  /** 量表比例 ≥ 此值時，ultimate 的 utility ×1.5；否則 ×0.3。 */
  spendOnUltimateAt?: number;
}

export type EnemyKind = "boss" | "lair" | "civilWar";

export interface EnemyProfile {
  id: string;
  kind: EnemyKind;
  personality: Personality;
  /** 額外的種族／個性 bias：對特定 consideration 加減權（典型 -1.0 ~ +1.5）。 */
  raceBias?: Partial<Record<ConsiderationId, number>>;
  gaugePolicy?: GaugePolicy;
  /** 巢穴模式專用：直接召喚的卡池（不消耗手牌/魔力）。 */
  summonPool?: string[];
}

/** 候選動作。enumerate 階段輸出，apply 階段消費。 */
export type CandidateAction =
  | { kind: "deployFromHand"; cardInstanceId: string; slotIdx: number }
  | { kind: "deployFromPool"; cardId: string; slotIdx: number }
  | { kind: "attack"; attackerInstanceId: string; target: "hero" | string /* troopInstanceId */ }
  | { kind: "spell"; cardInstanceId: string; targetRef?: string }
  | { kind: "skill"; skillId: string; targetRef?: string }
  | { kind: "ultimate"; skillId: string; targetRef?: string }
  | { kind: "endTurn" };

export type Weights = Record<ConsiderationId, number>;

export interface ScoredAction {
  action: CandidateAction;
  score: number;
  considerations: Partial<Record<ConsiderationId, number>>;
  jitter: number;
}

/** 難度旋鈕：不改人格，只改執行精度。 */
export interface DifficultyTuning {
  noiseScale: number;
  tempOffset: number;
  considerationDropProb: number;
  lookaheadDepth: 1 | 2;
}

export const DIFFICULTY_PRESETS: Record<"easy" | "normal" | "hard", DifficultyTuning> = {
  easy:   { noiseScale: 2.0, tempOffset:  0.4, considerationDropProb: 0.25, lookaheadDepth: 1 },
  normal: { noiseScale: 1.0, tempOffset:  0.0, considerationDropProb: 0.0,  lookaheadDepth: 1 },
  hard:   { noiseScale: 0.5, tempOffset: -0.1, considerationDropProb: 0.0,  lookaheadDepth: 2 },
};
