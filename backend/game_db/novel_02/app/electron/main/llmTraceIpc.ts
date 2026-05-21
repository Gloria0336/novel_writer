import { ipcMain } from "electron";
import { createLLMTraceStore } from "./llmTraceStore";
import type {
  LLMTraceAppendPayload,
  LLMTraceFinalResult,
  LLMTraceFinishPayload,
  LLMTraceStartPayload,
} from "../../src/llm/types";

const CHANNELS = {
  start: "llm-trace:start",
  append: "llm-trace:append",
  finish: "llm-trace:finish",
} as const;

export const llmTraceStore = createLLMTraceStore();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertStartPayload(value: unknown): asserts value is LLMTraceStartPayload {
  if (!isRecord(value)) throw new Error("Invalid llm-trace start payload");
  if (typeof value["sessionId"] !== "string") throw new Error("Missing sessionId");
  if (typeof value["model"] !== "string") throw new Error("Missing model");
  const meta = value["filenameMeta"];
  if (!isRecord(meta)) throw new Error("Missing filenameMeta");
  if (typeof meta["timestamp"] !== "string") throw new Error("Missing filenameMeta.timestamp");
  if (typeof meta["seed"] !== "number") throw new Error("Missing filenameMeta.seed");
  if (typeof meta["profileId"] !== "string") throw new Error("Missing filenameMeta.profileId");
}

function assertAppendPayload(value: unknown): asserts value is LLMTraceAppendPayload {
  if (!isRecord(value)) throw new Error("Invalid llm-trace append payload");
  if (typeof value["sessionId"] !== "string") throw new Error("Missing sessionId");
  if (!isRecord(value["entry"])) throw new Error("Missing entry");
}

function assertFinishPayload(value: unknown): asserts value is LLMTraceFinishPayload {
  if (!isRecord(value)) throw new Error("Invalid llm-trace finish payload");
  if (typeof value["sessionId"] !== "string") throw new Error("Missing sessionId");
  if (typeof value["reason"] !== "string") throw new Error("Missing reason");
  const fr = value["finalResult"];
  if (fr != null && fr !== "playerWin" && fr !== "playerLose" && fr !== "abandoned") {
    throw new Error(`Invalid finalResult: ${String(fr)}`);
  }
}

export function registerLLMTraceIpc(): void {
  ipcMain.handle(CHANNELS.start, (_event, payload: unknown) => {
    assertStartPayload(payload);
    return llmTraceStore.start(payload);
  });

  ipcMain.handle(CHANNELS.append, (_event, payload: unknown) => {
    assertAppendPayload(payload);
    return llmTraceStore.append(payload.sessionId, payload.entry);
  });

  ipcMain.handle(CHANNELS.finish, (_event, payload: unknown) => {
    assertFinishPayload(payload);
    return llmTraceStore.finish(
      payload.sessionId,
      payload.reason,
      payload.finalResult as LLMTraceFinalResult | undefined,
    );
  });
}
