import type { BattleState } from "../types/battle";

export interface StabilityChangeResult {
  newValue: number;
  newStage: 0 | 1 | 2 | 3 | 4;
  stageJustReached?: 1 | 2 | 3 | 4;
}

export function stageOf(value: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0) return 4;
  if (value <= 25) return 3;
  if (value <= 50) return 2;
  if (value <= 75) return 1;
  return 0;
}

export function applyStabilityDelta(state: BattleState, delta: number): StabilityChangeResult {
  const previous = state.stability;
  const newValue = Math.max(0, Math.min(100, previous + delta));
  const oldStage = state.corruptionStage;
  const newStage = stageOf(newValue);
  state.stability = newValue;
  state.corruptionStage = newStage;

  let stageJustReached: 1 | 2 | 3 | 4 | undefined;
  if (newStage > oldStage) {
    stageJustReached = newStage as 1 | 2 | 3 | 4;
  }
  return { newValue, newStage, stageJustReached };
}

/**
 * 75 → 兵力欄 -1（一次）。50 → 敵方額外部署（由 AI 處理，這裡只標記）。25 → 治療減半。0 → 直接敗北。
 * 此函式應在每次穩定度變化後呼叫。
 */
export function applyCorruptionStageEffects(state: BattleState, justReached: 1 | 2 | 3 | 4 | undefined): void {
  if (!justReached) return;
  if (justReached === 1) {
    // 兵力欄 -1（將最後一個欄位設為不可用：用 null 標記足以；但若已有兵力則摧毀）
    for (const side of ["player", "enemy"] as const) {
      const slots = state[side].troopSlots;
      if (slots.length > 0) {
        slots.pop();
      }
    }
    state.log.push({
      turn: state.turn, side: state.activeSide, kind: "CORRUPTION_75",
      text: "次元壁穩定度跌破 75 — 兵力欄 -1",
    });
  }
  if (justReached === 4) {
    state.result = "playerLose";
    state.endgameReason = "次元壁崩潰";
    state.log.push({
      turn: state.turn, side: state.activeSide, kind: "CORRUPTION_0",
      text: "次元壁崩潰 — 玩家敗北",
    });
  }
  if (justReached === 2) {
    state.log.push({ turn: state.turn, side: state.activeSide, kind: "CORRUPTION_50", text: "次元壁穩定度跌破 50 — 敵方獲得額外部署" });
  }
  if (justReached === 3) {
    state.log.push({ turn: state.turn, side: state.activeSide, kind: "CORRUPTION_25", text: "次元壁穩定度跌破 25 — 治療效果減半" });
  }
}

export function healingMultiplier(state: BattleState): number {
  return state.corruptionStage >= 3 ? 0.5 : 1;
}
