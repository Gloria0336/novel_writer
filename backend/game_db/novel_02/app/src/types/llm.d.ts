import type {
  LLMInferRequest,
  LLMInferResponse,
  LLMThoughtEntry,
  LLMTraceFinalResult,
  LLMTraceStartPayload,
  LLMTraceWriteResult,
} from "../llm/types";

export interface LLMAgentBridge {
  infer: (req: LLMInferRequest) => Promise<LLMInferResponse>;
  isConfigured: () => Promise<boolean>;
}

export interface LLMTraceBridge {
  start: (payload: LLMTraceStartPayload) => Promise<LLMTraceWriteResult>;
  append: (
    sessionId: string,
    entry: LLMThoughtEntry,
  ) => Promise<LLMTraceWriteResult | null>;
  finish: (
    sessionId: string,
    reason: string,
    finalResult?: LLMTraceFinalResult,
  ) => Promise<LLMTraceWriteResult | null>;
}

declare global {
  interface Window {
    llmAgent?: LLMAgentBridge;
    llmTrace?: LLMTraceBridge;
  }
}
