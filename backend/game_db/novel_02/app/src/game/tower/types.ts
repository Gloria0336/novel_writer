import type { HeroInstance } from "../../core/types/hero";

export type OmenId =
  | "twin_moons"        // 雙月同圓
  | "minor_eclipse"     // 副月凌主月
  | "shard_rain"        // 碎片雨
  | "solar_eclipse"     // 日蝕
  | "meteor"            // 流星墜
  | "spirit_surge";     // 靈潮湧動

export interface OmenInstance {
  id: OmenId;
  remainingTurns: number;
}

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
