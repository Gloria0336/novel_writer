import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { BattleState } from "../core/types/battle";
import type { GameAction } from "../core/turn/actions";
import { applyAction } from "../core/turn/reducer";
import { createBattle, createBattleContext, endPlayerTurnAndRunAI } from "./seed";
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
  // structuredClone supports Set; safe in modern Node/Browser
  // Sets in TroopInstance.keywords need to be preserved.
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
  seed?: number;
  children: ReactNode;
}

export function BattleProvider({ heroId, seed = Date.now() % 1_000_000, children }: ProviderProps): JSX.Element {
  const initial = useMemo(
    () => createBattle({ seed, playerHeroId: heroId, playerDeckIds: getStarterDeckIds(heroId) }),
    [heroId, seed],
  );
  const [internal, dispatch] = useReducer(reducer, { state: initial });

  const dispatchGame = useCallback((action: GameAction) => {
    dispatch({ type: "DISPATCH_GAME", action });
  }, []);

  const reset = useCallback(() => {
    const fresh = createBattle({ seed: seed + 1, playerHeroId: heroId, playerDeckIds: getStarterDeckIds(heroId) });
    dispatch({ type: "RESET", state: fresh });
  }, [heroId, seed]);

  const store = useMemo<BattleStore>(() => ({ state: internal.state, dispatch: dispatchGame, reset }), [internal.state, dispatchGame, reset]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useBattle(): BattleStore {
  const v = useContext(StoreContext);
  if (!v) throw new Error("useBattle must be used inside <BattleProvider>");
  return v;
}
