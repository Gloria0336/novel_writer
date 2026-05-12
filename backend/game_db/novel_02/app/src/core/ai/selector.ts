/**
 * Top-K softmax 抽樣 + jitter。隨機性走 state.rngState（可重現）。
 */
import { nextRng } from "../deck/prng";
import type { ScoredAction } from "./types";

const TOP_K = 3;

export interface SelectionContext {
  rngState: number;
  recklessness: number;
  /** difficulty 可以提供額外溫度偏移；預設 0。 */
  tempOffset?: number;
  /** difficulty 提供的噪音縮放；預設 1。 */
  noiseScale?: number;
}

export interface SelectionResult {
  rngState: number;
  chosen: ScoredAction;
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

  // Draw uniform [0,1) and pick.
  const draw = nextRng(rng);
  rng = draw.state;
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i]!;
    if (draw.value < acc) {
      return { rngState: rng, chosen: top[i]! };
    }
  }
  return { rngState: rng, chosen: top[top.length - 1]! };
}
