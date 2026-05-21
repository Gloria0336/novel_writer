import type { GameAction } from "../core/turn/actions";

export interface LLMInferRequest {
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMInferResponse {
  ok: boolean;
  jsonText?: string;
  usage?: { prompt: number; completion: number };
  error?: string;
}

export interface LLMThoughtEntry {
  turn: number;
  index: number;
  timestamp: string;
  model: string;
  legalActionCount: number;
  promptTokens?: number;
  completionTokens?: number;
  reasoning: string;
  chosenAction: GameAction;
  rawResponse?: string;
  validationError?: string;
  retryOf?: number;
}

export type LLMTraceFinalResult = "playerWin" | "playerLose" | "abandoned";

export interface LLMTraceDocument {
  schemaVersion: 1;
  sessionId: string;
  startedAt: string;
  endedAt?: string;
  endReason?: string;
  model: string;
  finalResult?: LLMTraceFinalResult;
  entries: LLMThoughtEntry[];
}

export interface LLMTraceWriteResult {
  sessionId: string;
  filePath: string;
}

export interface LLMTraceStartPayload {
  sessionId: string;
  model: string;
  filenameMeta: { timestamp: string; seed: number; profileId: string };
}

export interface LLMTraceAppendPayload {
  sessionId: string;
  entry: LLMThoughtEntry;
}

export interface LLMTraceFinishPayload {
  sessionId: string;
  reason: string;
  finalResult?: LLMTraceFinalResult;
}
