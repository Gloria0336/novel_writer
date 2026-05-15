import type { LogEntry } from "../core/types/battle";
import type { ConsiderationId } from "../core/ai/types";

export interface SessionMeta {
  sessionId: string;
  seed: number;
  profileId: string;
  playerHeroId: string;
  timestamp: string;
  durationMs: number;
  gameVersion: string;
}

export interface GameSummary {
  result: "playerWin" | "playerLose" | "ongoing";
  endgameReason?: string;
  totalTurns: number;
  finalPlayerHp: number;
  finalPlayerMaxHp: number;
  finalEnemyHp: number;
  finalEnemyMaxHp: number;
  finalStability: number;
  finalCorruptionStage: 0 | 1 | 2 | 3 | 4;
}

export interface TurnSummary {
  turn: number;
  side: "player" | "enemy";
  /** PLAY_TROOP + PLAY_SPELL + PLAY_ACTION + PLAY_EQUIPMENT + PLAY_FIELD */
  cardsPlayed: number;
  /** PLAY_TROOP + AI_DEPLOY + SUMMON（來自效果） */
  troopsSummoned: number;
  spellsCast: number;
  actionCardsCast: number;
  /** 該方本回合造成的實際傷害總量（DAMAGE_HERO + DAMAGE_TROOP payload.amount） */
  damageDealt: number;
  troopsDestroyed: number;
}

export interface AIAnalytics {
  totalDecisions: number;
  avgChosenScore: number;
  /** 各動作類型被選中的次數 */
  actionTypeDistribution: Record<string, number>;
  /** 各考量因素的平均分數（來自 chosen 動作的 top3[0].considerations） */
  avgConsiderationWeights: Partial<Record<ConsiderationId, number>>;
  /** 平均分數最高的考量因素 */
  topConsideration: string;
}

export interface BugIndicators {
  /** kind === "AI_ACTION_FAIL" 的次數 */
  aiActionFailCount: number;
  /** 所有 kind.endsWith("_FAIL") 的 log 數量 */
  illegalActionAttempts: number;
  /** SCRIPTED_MISSING 的次數（效果腳本缺失） */
  scriptedMissingCount: number;
}

export interface BalanceMetrics {
  avgCardsPlayedPerTurn: number;
  avgDamagePerTurn: number;
  playerSurvivalTurns: number;
  enemySurvivalTurns: number;
  stabilityLostTotal: number;
}

export type RecordingStatus = "ongoing" | "completed" | "abandoned";

export interface RecordingMeta {
  status: RecordingStatus;
  startedAt: string;
  lastSavedAt: string;
  endedAt?: string;
  endReason?: string;
}

export interface GameLogDocument {
  schemaVersion: 1;
  meta: SessionMeta;
  recording: RecordingMeta;
  summary: GameSummary;
  perTurnSummary: TurnSummary[];
  aiAnalytics: AIAnalytics;
  bugIndicators: BugIndicators;
  balanceMetrics: BalanceMetrics;
  /** 原始 BattleState.log（同一個參考） */
  rawLog: LogEntry[];
}

export interface RecordOpts {
  sessionId?: string;
  startTime?: number;
  recordingStatus?: RecordingStatus;
  startedAt?: string;
  lastSavedAt?: string;
  endedAt?: string;
  endReason?: string;
  /** Node.js 專用；預設 "logs"（相對於 process.cwd()） */
  logDir?: string;
}
