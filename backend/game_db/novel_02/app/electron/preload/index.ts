import { contextBridge, ipcRenderer } from "electron";
import type { GameLogDocument, RecordingStatus } from "../../src/logger/types";

const CHANNELS = {
  start: "game-log:start",
  update: "game-log:update",
  finish: "game-log:finish",
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
