import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type { BattleState, BattleResult } from "../core/types/battle";
import type { HeroInstance } from "../core/types/hero";
import type { GameAction } from "../core/turn/actions";
import { applyAction } from "../core/turn/reducer";
import { createBattle, createBattleContext, DEFAULT_ENEMY_ID, endPlayerTurnAndRunAI, type EnemyScale } from "./seed";
import { getStarterDeckIds } from "../data/decks";

interface BattleStore {
  state: BattleState;
  dispatch: (action: GameAction) => void;
  reset: () => void;
}

type ReducerAction = { type: "DISPATCH_GAME"; action: GameAction } | { type: "RESET"; state: BattleState };

interface InternalState {
  state: BattleState;
}

function deepClone<T>(v: T): T {
  return structuredClone(v);
}

function reducer(internal: InternalState, ra: ReducerAction): InternalState {
  if (ra.type === "RESET") return { state: ra.state };
  const ctx = createBattleContext();
  const next = deepClone(internal.state);
  if (ra.action.type === "END_TURN") {
    endPlayerTurnAndRunAI(next, ctx);
  } else {
    applyAction(next, ra.action, ctx);
  }
  return { state: next };
}

const StoreContext = createContext<BattleStore | null>(null);

interface ProviderProps {
  heroId: string;
  enemyId?: string;
  seed?: number;
  initialPlayerHero?: HeroInstance;
  initialDeckIds?: string[];
  enemyScale?: EnemyScale;
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
    }),
    // 戰鬥初始化僅取一次 — 後續變更走 dispatch / reset。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [heroId, enemyId, seed],
  );
  const [internal, dispatch] = useReducer(reducer, { state: initial });

  const endedRef = useRef(false);
  useEffect(() => {
    if (endedRef.current) return;
    if (internal.state.result !== "ongoing") {
      endedRef.current = true;
      onBattleEnd?.(internal.state.result as Exclude<BattleResult, "ongoing">, internal.state);
    }
  }, [internal.state, onBattleEnd]);

  const dispatchGame = useCallback((action: GameAction) => {
    dispatch({ type: "DISPATCH_GAME", action });
  }, []);

  const reset = useCallback(() => {
    endedRef.current = false;
    const fresh = createBattle({
      seed: seed + 1,
      playerHeroId: heroId,
      playerDeckIds: initialDeckIds ?? getStarterDeckIds(heroId),
      enemyId,
      initialPlayerHero,
      enemyScale,
    });
    dispatch({ type: "RESET", state: fresh });
  }, [heroId, enemyId, seed, initialDeckIds, initialPlayerHero, enemyScale]);

  const store = useMemo<BattleStore>(() => ({ state: internal.state, dispatch: dispatchGame, reset }), [internal.state, dispatchGame, reset]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useBattle(): BattleStore {
  const v = useContext(StoreContext);
  if (!v) throw new Error("useBattle must be used inside <BattleProvider>");
  return v;
}
