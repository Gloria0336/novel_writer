import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeGameLogFilename } from "../../src/logger/filename";
import type {
  LLMThoughtEntry,
  LLMTraceDocument,
  LLMTraceFinalResult,
  LLMTraceStartPayload,
  LLMTraceWriteResult,
} from "../../src/llm/types";

export interface LLMTraceStore {
  start: (payload: LLMTraceStartPayload) => LLMTraceWriteResult;
  append: (sessionId: string, entry: LLMThoughtEntry) => LLMTraceWriteResult | null;
  finish: (sessionId: string, reason: string, finalResult?: LLMTraceFinalResult) => LLMTraceWriteResult | null;
  abandonAll: (reason: string) => LLMTraceWriteResult[];
  activeCount: () => number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function llmFilename(meta: { timestamp: string; seed: number; profileId: string }): string {
  const base = makeGameLogFilename(meta);
  return base.replace(/\.json$/, "_llm.json");
}

export function createLLMTraceStore(logDir = join(process.cwd(), "logs")): LLMTraceStore {
  const activeDocs = new Map<string, LLMTraceDocument>();
  const filePaths = new Map<string, string>();

  function writeDoc(doc: LLMTraceDocument): LLMTraceWriteResult {
    mkdirSync(logDir, { recursive: true });
    const filePath = filePaths.get(doc.sessionId);
    if (!filePath) throw new Error(`LLM trace path not registered for session ${doc.sessionId}`);
    writeFileSync(filePath, JSON.stringify(doc, null, 2), "utf-8");
    return { sessionId: doc.sessionId, filePath };
  }

  function start(payload: LLMTraceStartPayload): LLMTraceWriteResult {
    const filePath = join(logDir, llmFilename(payload.filenameMeta));
    filePaths.set(payload.sessionId, filePath);
    const doc: LLMTraceDocument = {
      schemaVersion: 1,
      sessionId: payload.sessionId,
      startedAt: nowIso(),
      model: payload.model,
      entries: [],
    };
    activeDocs.set(payload.sessionId, doc);
    return writeDoc(doc);
  }

  function append(sessionId: string, entry: LLMThoughtEntry): LLMTraceWriteResult | null {
    const doc = activeDocs.get(sessionId);
    if (!doc) return null;
    doc.entries.push(entry);
    return writeDoc(doc);
  }

  function finish(
    sessionId: string,
    reason: string,
    finalResult?: LLMTraceFinalResult,
  ): LLMTraceWriteResult | null {
    const doc = activeDocs.get(sessionId);
    if (!doc) return null;
    doc.endedAt = nowIso();
    doc.endReason = reason;
    if (finalResult) doc.finalResult = finalResult;
    const result = writeDoc(doc);
    activeDocs.delete(sessionId);
    return result;
  }

  function abandonAll(reason: string): LLMTraceWriteResult[] {
    const out: LLMTraceWriteResult[] = [];
    for (const sessionId of Array.from(activeDocs.keys())) {
      const r = finish(sessionId, reason, "abandoned");
      if (r) out.push(r);
    }
    return out;
  }

  return { start, append, finish, abandonAll, activeCount: () => activeDocs.size };
}
