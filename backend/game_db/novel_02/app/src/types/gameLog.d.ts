import type { GameLogDocument, RecordingStatus } from "../logger/types";

type FinalRecordingStatus = Exclude<RecordingStatus, "ongoing">;

export interface GameLogBridge {
  start: (doc: GameLogDocument) => Promise<unknown>;
  update: (doc: GameLogDocument) => Promise<unknown>;
  finish: (
    sessionId: string,
    status: FinalRecordingStatus,
    reason: string,
    finalDoc?: GameLogDocument,
  ) => Promise<unknown>;
}

declare global {
  interface Window {
    gameLog?: GameLogBridge;
  }
}
