import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeGameLogFilename } from "../../src/logger/filename";
import type { GameLogDocument, RecordingStatus } from "../../src/logger/types";

export type FinalRecordingStatus = Exclude<RecordingStatus, "ongoing">;

export interface GameLogWriteResult {
  sessionId: string;
  filePath: string;
}

export interface GameLogStore {
  start: (doc: GameLogDocument) => GameLogWriteResult;
  update: (doc: GameLogDocument) => GameLogWriteResult;
  finish: (
    sessionId: string,
    status: FinalRecordingStatus,
    reason: string,
    finalDoc?: GameLogDocument,
  ) => GameLogWriteResult | null;
  abandonAll: (reason: string) => GameLogWriteResult[];
  activeCount: () => number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function withLastSaved(doc: GameLogDocument, savedAt = nowIso()): GameLogDocument {
  return {
    ...doc,
    recording: {
      ...doc.recording,
      lastSavedAt: savedAt,
    },
  };
}

function withFinalStatus(
  doc: GameLogDocument,
  status: FinalRecordingStatus,
  reason: string,
  savedAt = nowIso(),
): GameLogDocument {
  return {
    ...doc,
    recording: {
      ...doc.recording,
      status,
      lastSavedAt: savedAt,
      endedAt: doc.recording.endedAt ?? savedAt,
      endReason: reason || doc.recording.endReason,
    },
  };
}

export function createGameLogStore(logDir = join(process.cwd(), "logs")): GameLogStore {
  const activeDocs = new Map<string, GameLogDocument>();
  const filePaths = new Map<string, string>();

  function filePathFor(doc: GameLogDocument): string {
    const existing = filePaths.get(doc.meta.sessionId);
    if (existing) return existing;
    const filePath = join(logDir, makeGameLogFilename(doc.meta));
    filePaths.set(doc.meta.sessionId, filePath);
    return filePath;
  }

  function writeDoc(doc: GameLogDocument): GameLogWriteResult {
    mkdirSync(logDir, { recursive: true });
    const filePath = filePathFor(doc);
    writeFileSync(filePath, JSON.stringify(doc, null, 2), "utf-8");
    return { sessionId: doc.meta.sessionId, filePath };
  }

  function start(doc: GameLogDocument): GameLogWriteResult {
    const savedDoc = withLastSaved(doc);
    activeDocs.set(savedDoc.meta.sessionId, savedDoc);
    return writeDoc(savedDoc);
  }

  function update(doc: GameLogDocument): GameLogWriteResult {
    const savedDoc = withLastSaved(doc);
    if (savedDoc.recording.status === "ongoing") {
      activeDocs.set(savedDoc.meta.sessionId, savedDoc);
    } else {
      activeDocs.delete(savedDoc.meta.sessionId);
    }
    return writeDoc(savedDoc);
  }

  function finish(
    sessionId: string,
    status: FinalRecordingStatus,
    reason: string,
    finalDoc?: GameLogDocument,
  ): GameLogWriteResult | null {
    const sourceDoc = finalDoc ?? activeDocs.get(sessionId);
    if (!sourceDoc) return null;

    const savedDoc = withFinalStatus(sourceDoc, status, reason);
    activeDocs.delete(sessionId);
    return writeDoc(savedDoc);
  }

  function abandonAll(reason: string): GameLogWriteResult[] {
    const results: GameLogWriteResult[] = [];
    for (const [sessionId, doc] of Array.from(activeDocs.entries())) {
      const result = finish(sessionId, "abandoned", reason, doc);
      if (result) results.push(result);
    }
    return results;
  }

  return {
    start,
    update,
    finish,
    abandonAll,
    activeCount: () => activeDocs.size,
  };
}
