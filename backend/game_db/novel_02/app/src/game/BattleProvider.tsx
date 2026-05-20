import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { BattleState, BattleResult } from "../core/types/battle";
import type { HeroInstance } from "../core/types/hero";
import type { GameAction } from "../core/turn/actions";
import type { OmenId } from "../core/types/omen";
import type { BattleVisualEvent, BattleVisualStep } from "../core/types/visual";
import { createBattle, createBattleContext, DEFAULT_ENEMY_ID, applyPlayerActionWithTimeline, type EnemyScale } from "./seed";
import { getStarterDeckIds } from "../data/decks";
import { useBattleAutoRecorder } from "../logger/useBattleAutoRecorder";

interface BattleStore {
  state: BattleState;
  actionState: BattleState;
  dispatch: (action: GameAction) => void;
  reset: () => void;
  canAct: boolean;
  isAnimating: boolean;
  visualEvents: BattleVisualEvent[];
}

function deepClone<T>(v: T): T {
  return structuredClone(v);
}

const StoreContext = createContext<BattleStore | null>(null);

interface ProviderProps {
  heroId: string;
  enemyId?: string;
  seed?: number;
  initialPlayerHero?: HeroInstance;
  initialDeckIds?: string[];
  enemyScale?: EnemyScale;
  omen?: OmenId | null;
  onBattleEnd?: (result: Exclude<BattleResult, "ongoing">, finalState: BattleState) => void;
  children: ReactNode;
}

export function BattleProvider({
  heroId,
  enemyId = DEFAULT_ENEMY_ID,
  seed = Date.now() % 1_000_000,
  initialPlayerHero,
  initialDeckIds,
  enemyScale,
  omen,
  onBattleEnd,
  children,
}: ProviderProps): JSX.Element {
  const initial = useMemo(
    () => createBattle({
      seed,
      playerHeroId: heroId,
      playerDeckIds: initialDeckIds ?? getStarterDeckIds(heroId),
      enemyId,
      initialPlayerHero,
      enemyScale,
      omen,
    }),
    // 戰鬥初始化僅取一次 — 後續變更走 dispatch / reset。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [heroId, enemyId, seed],
  );
  const [settledState, setSettledState] = useState(initial);
  const [displayState, setDisplayState] = useState(initial);
  const [activeStep, setActiveStep] = useState<BattleVisualStep | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const settledRef = useRef(settledState);
  const animatingRef = useRef(false);
  const playbackIdRef = useRef(0);
  const playbackTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    settledRef.current = settledState;
  }, [settledState]);

  useEffect(() => {
    animatingRef.current = isAnimating;
  }, [isAnimating]);

  useBattleAutoRecorder(settledState);

  const endedRef = useRef(false);
  useEffect(() => {
    if (endedRef.current) return;
    if (settledState.result !== "ongoing") {
      endedRef.current = true;
      onBattleEnd?.(settledState.result as Exclude<BattleResult, "ongoing">, settledState);
    }
  }, [settledState, onBattleEnd]);

  const stopPlayback = useCallback(() => {
    playbackIdRef.current += 1;
    if (playbackTimeoutRef.current !== undefined) {
      window.clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = undefined;
    }
  }, []);

  const playTimeline = useCallback((steps: BattleVisualStep[], finalState: BattleState) => {
    stopPlayback();
    if (steps.length === 0) {
      setActiveStep(null);
      setDisplayState(finalState);
      animatingRef.current = false;
      setIsAnimating(false);
      return;
    }

    const playbackId = playbackIdRef.current;
    let index = 0;

    animatingRef.current = true;
    setIsAnimating(true);

    const playNext = (): void => {
      if (playbackIdRef.current !== playbackId) return;
      const step = steps[index];
      if (!step) {
        setActiveStep(null);
        setDisplayState(finalState);
        animatingRef.current = false;
        setIsAnimating(false);
        return;
      }
      setActiveStep(step);
      setDisplayState(step.stateSnapshot);
      index += 1;
      playbackTimeoutRef.current = window.setTimeout(playNext, step.durationMs);
    };

    playNext();
  }, [stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  const dispatchGame = useCallback((action: GameAction) => {
    if (animatingRef.current) return;
    const ctx = createBattleContext();
    const next = deepClone(settledRef.current);
    const result = applyPlayerActionWithTimeline(next, action, ctx);
    if (!result.ok) return;
    settledRef.current = next;
    setSettledState(next);
    if (result.timeline.length > 0) {
      playTimeline(result.timeline, next);
    } else {
      setDisplayState(next);
    }
  }, [playTimeline]);

  const reset = useCallback(() => {
    endedRef.current = false;
    const fresh = createBattle({
      seed: seed + 1,
      playerHeroId: heroId,
      playerDeckIds: initialDeckIds ?? getStarterDeckIds(heroId),
      enemyId,
      initialPlayerHero,
      enemyScale,
      omen,
    });
    stopPlayback();
    settledRef.current = fresh;
    setSettledState(fresh);
    setDisplayState(fresh);
    setActiveStep(null);
    animatingRef.current = false;
    setIsAnimating(false);
  }, [heroId, enemyId, seed, initialDeckIds, initialPlayerHero, enemyScale, omen, stopPlayback]);

  const canAct = !isAnimating && settledState.activeSide === "player" && settledState.result === "ongoing";
  const store = useMemo<BattleStore>(
    () => ({ state: displayState, actionState: settledState, dispatch: dispatchGame, reset, canAct, isAnimating, visualEvents: activeStep?.events ?? [] }),
    [displayState, settledState, dispatchGame, reset, canAct, isAnimating, activeStep],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useBattle(): BattleStore {
  const v = useContext(StoreContext);
  if (!v) throw new Error("useBattle must be used inside <BattleProvider>");
  return v;
}
