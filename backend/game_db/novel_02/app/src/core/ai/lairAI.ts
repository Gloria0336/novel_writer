/**
 * @deprecated 自 utility AI 引擎引入後，本檔僅為向後相容的薄包裝。
 * 新呼叫端請直接使用 `runEnemyAITurn(state, ctx, profile)`。
 */
import type { BattleState } from "../types/battle";
import type { BattleContext } from "../types/context";
import { runEnemyAITurn } from "./engine";
import { PUTREFACTIVE_LAIR_PROFILE } from "./profiles/lairPutrefactive";

export function runLairAITurn(state: BattleState, ctx: BattleContext): void {
  runEnemyAITurn(state, ctx, PUTREFACTIVE_LAIR_PROFILE);
}
