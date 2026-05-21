import { contextBridge, ipcRenderer } from "electron";
import type { GameLogDocument, RecordingStatus } from "../../src/logger/types";
import type {
  LLMInferRequest,
  LLMInferResponse,
  LLMThoughtEntry,
  LLMTraceFinalResult,
  LLMTraceStartPayload,
  LLMTraceWriteResult,
} from "../../src/llm/types";

const CHANNELS = {
  start: "game-log:start",
  update: "game-log:update",
  finish: "game-log:finish",
} as const;

const LLM_CHANNELS = {
  infer: "llm-agent:infer",
  isConfigured: "llm-agent:isConfigured",
  traceStart: "llm-trace:start",
  traceAppend: "llm-trace:append",
  traceFinish: "llm-trace:finish",
} as const;

type FinalRecordingStatus = Exclude<RecordingStatus, "ongoing">;

contextBridge.exposeInMainWorld("gameLog", {
  start: (doc: GameLogDocument) => ipcRenderer.invoke(CHANNELS.start, doc),
  update: (doc: GameLogDocument) => ipcRenderer.invoke(CHANNELS.update, doc),
  finish: (
    sessionId: string,
    status: FinalRecordingStatus,
    reason: string,
    finalDoc?: GameLogDocument,
  ) => ipcRenderer.invoke(CHANNELS.finish, { sessionId, status, reason, finalDoc }),
});

contextBridge.exposeInMainWorld("llmAgent", {
  infer: (req: LLMInferRequest): Promise<LLMInferResponse> =>
    ipcRenderer.invoke(LLM_CHANNELS.infer, req),
  isConfigured: (): Promise<boolean> => ipcRenderer.invoke(LLM_CHANNELS.isConfigured),
});

contextBridge.exposeInMainWorld("llmTrace", {
  start: (payload: LLMTraceStartPayload): Promise<LLMTraceWriteResult> =>
    ipcRenderer.invoke(LLM_CHANNELS.traceStart, payload),
  append: (sessionId: string, entry: LLMThoughtEntry): Promise<LLMTraceWriteResult | null> =>
    ipcRenderer.invoke(LLM_CHANNELS.traceAppend, { sessionId, entry }),
  finish: (
    sessionId: string,
    reason: string,
    finalResult?: LLMTraceFinalResult,
  ): Promise<LLMTraceWriteResult | null> =>
    ipcRenderer.invoke(LLM_CHANNELS.traceFinish, { sessionId, reason, finalResult }),
});
