import { useEffect, useRef } from "react";
import type { BattleState } from "../core/types/battle";
import type { EnemyProfile } from "../core/ai/types";
import { ENEMY_PROFILES } from "../core/ai/profiles";
import { ENEMIES } from "../data/enemies";
import { summarizeGame } from "./analyze";
import type { GameLogDocument, RecordingStatus } from "./types";

type FinalRecordingStatus = Exclude<RecordingStatus, "ongoing">;

interface RecordingSession {
  sessionId: string;
  startTime: number;
  startedAt: string;
  started: boolean;
  finalized: boolean;
}

function makeSessionId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createSession(): RecordingSession {
  return {
    sessionId: makeSessionId(),
    startTime: Date.now(),
    startedAt: new Date().toISOString(),
    started: false,
    finalized: false,
  };
}

function resolveEnemyProfile(state: BattleState): EnemyProfile | undefined {
  const enemyId = state.enemy.hero.defId;
  const profileId = ENEMIES[enemyId]?.profileId;
  return profileId ? ENEMY_PROFILES[profileId] : undefined;
}

function buildDocument(
  state: BattleState,
  profile: EnemyProfile,
  session: RecordingSession,
  status: RecordingStatus,
  endReason?: string,
): GameLogDocument {
  const now = new Date().toISOString();
  return summarizeGame(state, profile, {
    sessionId: session.sessionId,
    startTime: session.startTime,
    startedAt: session.startedAt,
    lastSavedAt: now,
    recordingStatus: status,
    endedAt: status === "ongoing" ? undefined : now,
    endReason,
  });
}

function sendGameLog(operation: () => Promise<unknown>): void {
  try {
    void operation().catch((error) => {
      console.error("Battle log recording failed", error);
    });
  } catch (error) {
    console.error("Battle log recording failed", error);
  }
}

function gameLogBridge(): Window["gameLog"] | undefined {
  if (typeof window === "undefined") return undefined;
  return window.gameLog;
}

export function useBattleAutoRecorder(state: BattleState): void {
  const sessionRef = useRef<RecordingSession | null>(null);
  const latestStateRef = useRef(state);

  latestStateRef.current = state;

  useEffect(() => {
    const bridge = gameLogBridge();
    if (!bridge) return;

    const profile = resolveEnemyProfile(state);
    if (!profile) return;

    const session = sessionRef.current ?? createSession();
    sessionRef.current = session;
    if (session.finalized) return;

    if (state.result !== "ongoing") {
      const doc = buildDocument(state, profile, session, "completed", "battle completed");
      session.finalized = true;
      sendGameLog(() => bridge.finish(session.sessionId, "completed", "battle completed", doc));
      return;
    }

    const doc = buildDocument(state, profile, session, "ongoing");

    if (!session.started) {
      session.started = true;
      sendGameLog(() => bridge.start(doc));
    } else {
      sendGameLog(() => bridge.update(doc));
    }
  }, [state]);

  useEffect(() => {
    const finishAbandoned = (reason: string): void => {
      const bridge = gameLogBridge();
      const session = sessionRef.current;
      if (!bridge || !session || session.finalized) return;

      const currentState = latestStateRef.current;
      const profile = resolveEnemyProfile(currentState);
      if (!profile) return;

      const doc = buildDocument(currentState, profile, session, "abandoned", reason);
      session.finalized = true;
      sendGameLog(() => bridge.finish(session.sessionId, "abandoned", reason, doc));
    };

    const onPageHide = (): void => finishAbandoned("pagehide");
    const onBeforeUnload = (): void => finishAbandoned("beforeunload");

    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      finishAbandoned("battle view unmounted");
    };
  }, []);
}
