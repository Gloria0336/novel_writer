import { ipcMain } from "electron";
import { createGameLogStore, type FinalRecordingStatus } from "./gameLogStore";
import type { GameLogDocument, RecordingStatus } from "../../src/logger/types";

const CHANNELS = {
  start: "game-log:start",
  update: "game-log:update",
  finish: "game-log:finish",
} as const;

export const gameLogStore = createGameLogStore();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertGameLogDocument(value: unknown): asserts value is GameLogDocument {
  if (!isRecord(value)) throw new Error("Invalid game log document");
  if (value["schemaVersion"] !== 1) throw new Error("Invalid game log schema");

  const meta = value["meta"];
  if (!isRecord(meta) || typeof meta["sessionId"] !== "string") {
    throw new Error("Invalid game log session");
  }
}

function assertFinalStatus(value: unknown): asserts value is FinalRecordingStatus {
  if (value !== "completed" && value !== "abandoned") {
    throw new Error(`Invalid game log final status: ${String(value)}`);
  }
}

export interface FinishGameLogPayload {
  sessionId: string;
  status: Exclude<RecordingStatus, "ongoing">;
  reason: string;
  finalDoc?: GameLogDocument;
}

function assertFinishPayload(value: unknown): asserts value is FinishGameLogPayload {
  if (!isRecord(value) || typeof value["sessionId"] !== "string") {
    throw new Error("Invalid game log finish payload");
  }
  assertFinalStatus(value["status"]);
  if (value["finalDoc"] != null) assertGameLogDocument(value["finalDoc"]);
}

export function registerGameLogIpc(): void {
  ipcMain.handle(CHANNELS.start, (_event, doc: unknown) => {
    assertGameLogDocument(doc);
    return gameLogStore.start(doc);
  });

  ipcMain.handle(CHANNELS.update, (_event, doc: unknown) => {
    assertGameLogDocument(doc);
    return gameLogStore.update(doc);
  });

  ipcMain.handle(CHANNELS.finish, (_event, payload: unknown) => {
    assertFinishPayload(payload);
    return gameLogStore.finish(payload.sessionId, payload.status, payload.reason, payload.finalDoc);
  });
}
