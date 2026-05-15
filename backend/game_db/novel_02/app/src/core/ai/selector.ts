/**
 * Top-K softmax 抽樣 + jitter。隨機性走 state.rngState（可重現）。
 */
import { nextRng } from "../deck/prng";
import type { CandidateAction, ScoredAction } from "./types";

const TOP_K = 3;

export interface SelectionContext {
  rngState: number;
  recklessness: number;
  /** difficulty 可以提供額外溫度偏移；預設 0。 */
  tempOffset?: number;
  /** difficulty 提供的噪音縮放；預設 1。 */
  noiseScale?: number;
}

export interface SelectionDebug {
  /** softmax 溫度（已套用 recklessness + tempOffset） */
  temperature: number;
  /** 進入 pickAction 時的 rngState（快照） */
  rngStateBefore: number;
  /** Top-K（依 jittered 分數降序）；prob 為 softmax 機率 */
  topK: Array<{
    action: CandidateAction;
    scoreJittered: number;
    jitter: number;
    prob: number;
  }>;
  /** softmax 抽樣抽到的 [0,1) 值 */
  rngDraw: number;
  /** 被命中的 topK 索引 */
  chosenIndexInTopK: number;
}

export interface SelectionResult {
  rngState: number;
  chosen: ScoredAction;
  debug: SelectionDebug;
}

/**
 * 對單一分數套用 ±5% jitter（× noiseScale）。回傳新的 rngState 與微擾後分數。
 */
export function jitterScore(state: number, score: number, noiseScale = 1): { state: number; score: number; jitter: number } {
  const r = nextRng(state);
  const eps = (r.value - 0.5) * 0.1 * noiseScale; // ε ∈ [-0.05, +0.05] × noiseScale
  return { state: r.state, score: score * (1 + eps), jitter: eps };
}

/**
 * 從候選清單抽樣：
 * 1. 對每個動作的 total score 套 jitter。
 * 2. 取 top-K（K=3）。
 * 3. 用 softmax(temperature = 0.15 + 0.5×recklessness + tempOffset) 抽樣。
 * 4. 平手用 rng 破。
 */
export function pickAction(scored: ScoredAction[], ctxSel: SelectionContext): SelectionResult {
  if (scored.length === 0) throw new Error("pickAction: empty candidate list");
  const rngStateBefore = ctxSel.rngState;
  let rng = ctxSel.rngState;

  // Apply jitter to each.
  const withJitter: ScoredAction[] = scored.map((s) => {
    const j = jitterScore(rng, s.score, ctxSel.noiseScale ?? 1);
    rng = j.state;
    return { ...s, score: j.score, jitter: j.jitter };
  });

  // Sort desc.
  withJitter.sort((a, b) => b.score - a.score);

  // Top-K.
  const top = withJitter.slice(0, Math.min(TOP_K, withJitter.length));

  // Softmax sample.
  const T = Math.max(0.05, 0.15 + 0.5 * ctxSel.recklessness + (ctxSel.tempOffset ?? 0));
  const maxScore = top[0]!.score;
  const expScores = top.map((s) => Math.exp((s.score - maxScore) / T));
  const sum = expScores.reduce((a, b) => a + b, 0);
  const probs = expScores.map((e) => e / sum);

  const topKDebug = top.map((s, i) => ({
    action: s.action,
    scoreJittered: s.score,
    jitter: s.jitter,
    prob: probs[i]!,
  }));

  // Draw uniform [0,1) and pick.
  const draw = nextRng(rng);
  rng = draw.state;
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i]!;
    if (draw.value < acc) {
      return {
        rngState: rng,
        chosen: top[i]!,
        debug: { temperature: T, rngStateBefore, topK: topKDebug, rngDraw: draw.value, chosenIndexInTopK: i },
      };
    }
  }
  const fallbackIdx = top.length - 1;
  return {
    rngState: rng,
    chosen: top[fallbackIdx]!,
    debug: { temperature: T, rngStateBefore, topK: topKDebug, rngDraw: draw.value, chosenIndexInTopK: fallbackIdx },
  };
}
