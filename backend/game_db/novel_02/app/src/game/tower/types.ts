import type { HeroInstance } from "../../core/types/hero";
import type { OmenId, OmenInstance } from "../../core/types/omen";

export type { OmenId, OmenInstance };

export type TowerReward =
  | { kind: "heal"; amount: number }
  | { kind: "addCard"; cardId: string }
  | { kind: "buffMaxHp"; amount: number }
  | { kind: "buffAtk"; amount: number };

export interface FloorEntry {
  floor: number;
  kind: "boss" | "lair";
  enemyId: string;
}

export type TowerStatus = "preFloor" | "inBattle" | "rewardSelect" | "won" | "lost";

export interface TowerRunHistoryEntry {
  floor: number;
  enemyId: string;
  outcome: "win" | "loss";
}

export interface TowerRunState {
  seed: number;
  rngState: number;
  heroId: string;
  floor: number;
  heroSnapshot: HeroInstance;
  deckIds: string[];
  rewardsTaken: TowerReward[];
  activeOmen: OmenId | null;
  status: TowerStatus;
  history: TowerRunHistoryEntry[];
  pendingRewards?: TowerReward[];
}
