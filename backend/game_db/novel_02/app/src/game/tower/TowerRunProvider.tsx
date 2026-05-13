import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { BattleState, BattleResult } from "../../core/types/battle";
import type { HeroInstance } from "../../core/types/hero";
import type { TowerRunState, TowerReward } from "./types";
import { getFloorEntry } from "./towerData";
import { generateRewards, applyReward } from "./towerRewards";
import { pickOmen } from "./towerScaling";
import { createBattle, createBattleContext } from "../seed";
import { getStarterDeckIds } from "../../data/decks";

interface TowerRunStore {
  run: TowerRunState | null;
  startRun: (heroId: string, seed?: number) => void;
  enterFloor: () => void;
  finishBattle: (result: Exclude<BattleResult, "ongoing">, finalState: BattleState) => void;
  applyChosenReward: (reward: TowerReward) => void;
  abandon: () => void;
}

const Ctx = createContext<TowerRunStore | null>(null);

function snapshotPlayerFromBattle(state: BattleState): HeroInstance {
  // 戰鬥結束後保留 HP/裝備，但重置鬥志、量表、護甲、buff、暈眩等戰場狀態
  const h = state.player.hero;
  return {
    ...h,
    morale: 0,
    gaugeValue: 0,
    armor: 0,
    buffs: [],
    flags: { ...h.flags, ultimateUsed: false, immortalUsed: false, bossPhase: undefined },
  };
}

function makeFreshHero(heroId: string, ctx: ReturnType<typeof createBattleContext>): HeroInstance {
  // 透過 createBattle 短路：實際只用第一回合 state 的玩家 hero。較貴但只跑一次。
  const tmp = createBattle({
    seed: 1,
    playerHeroId: heroId,
    playerDeckIds: getStarterDeckIds(heroId),
    enemyId: "putrefactive_lair",
  });
  return tmp.player.hero;
}

export function TowerRunProvider({ children }: { children: ReactNode }): JSX.Element {
  const [run, setRun] = useState<TowerRunState | null>(null);

  const startRun = useCallback((heroId: string, seed = Date.now() % 1_000_000) => {
    const ctx = createBattleContext();
    const fresh = makeFreshHero(heroId, ctx);
    const omenPick = pickOmen(seed, getFloorEntry(1));
    setRun({
      seed,
      rngState: omenPick.nextRngState,
      heroId,
      floor: 1,
      heroSnapshot: fresh,
      deckIds: getStarterDeckIds(heroId),
      rewardsTaken: [],
      activeOmen: omenPick.omen,
      status: "preFloor",
      history: [],
    });
  }, []);

  const enterFloor = useCallback(() => {
    setRun((r) => (r ? { ...r, status: "inBattle" } : r));
  }, []);

  const finishBattle = useCallback((result: Exclude<BattleResult, "ongoing">, finalState: BattleState) => {
    setRun((r) => {
      if (!r) return r;
      const entry = getFloorEntry(r.floor);
      if (result === "playerLose") {
        return {
          ...r,
          status: "lost",
          history: [...r.history, { floor: r.floor, enemyId: entry.enemyId, outcome: "loss" }],
        };
      }
      // 勝利
      const playerSnap = snapshotPlayerFromBattle(finalState);
      const isFinalFloor = r.floor >= 30;
      if (isFinalFloor) {
        return {
          ...r,
          heroSnapshot: playerSnap,
          status: "won",
          history: [...r.history, { floor: r.floor, enemyId: entry.enemyId, outcome: "win" }],
        };
      }
      const rewardGen = generateRewards(r.rngState, r.floor);
      return {
        ...r,
        rngState: rewardGen.nextRngState,
        heroSnapshot: playerSnap,
        status: "rewardSelect",
        pendingRewards: rewardGen.rewards,
        history: [...r.history, { floor: r.floor, enemyId: entry.enemyId, outcome: "win" }],
      };
    });
  }, []);

  const applyChosenReward = useCallback((reward: TowerReward) => {
    setRun((r) => {
      if (!r) return r;
      const { hero, deckIds } = applyReward(reward, r.heroSnapshot, r.deckIds);
      const nextFloor = r.floor + 1;
      const omenPick = pickOmen(r.rngState, getFloorEntry(nextFloor));
      return {
        ...r,
        floor: nextFloor,
        heroSnapshot: hero,
        deckIds,
        rewardsTaken: [...r.rewardsTaken, reward],
        rngState: omenPick.nextRngState,
        activeOmen: omenPick.omen,
        status: "preFloor",
        pendingRewards: undefined,
      };
    });
  }, []);

  const abandon = useCallback(() => setRun(null), []);

  const store = useMemo<TowerRunStore>(() => ({ run, startRun, enterFloor, finishBattle, applyChosenReward, abandon }), [run, startRun, enterFloor, finishBattle, applyChosenReward, abandon]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useTowerRun(): TowerRunStore {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTowerRun must be used inside <TowerRunProvider>");
  return v;
}
