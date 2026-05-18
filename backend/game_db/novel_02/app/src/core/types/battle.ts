import type { CardInstance } from "./card";
import type { ActiveBuff, HeroInstance } from "./hero";
import type { Keyword } from "./keyword";
import type { Side } from "./effect";
import type { RiftState } from "./rift";

export interface ActiveKeywordBuff {
  id: string;
  source: string;
  keyword: Keyword;
  remainingTurns: number;
}

export interface TroopInstance {
  instanceId: string;
  cardId: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  keywords: Set<Keyword>;
  hasAttackedThisTurn: boolean;
  summonedThisTurn: boolean;
  frozenTurns: number;
  buffs: ActiveBuff[];
  keywordBuffs?: ActiveKeywordBuff[];
  /** v3.3 滲透體標記：true 時擊殺者獲 +10 鬥志（不是 +15 一般擊殺）。 */
  fromRift?: boolean;
}

export interface SideState {
  hero: HeroInstance;
  manaCurrent: number;
  manaCap: number;
  manaCapAbsolute: number;
  tempMana: number;
  deck: CardInstance[];
  hand: CardInstance[];
  graveyard: CardInstance[];
  troopSlots: (TroopInstance | null)[];
  spellsCastThisTurn: number;
  spellsCastThisGame: number;
}

export interface FieldState {
  cardId: string;
  ownerSide: Side;
}

export interface LogEntry {
  turn: number;
  side: Side;
  kind: string;
  text: string;
  payload?: Record<string, unknown>;
}

export type BattleResult = "ongoing" | "playerWin" | "playerLose";

export interface BattleState {
  seed: number;
  rngState: number;
  nextInstanceId: number;
  turn: number;
  activeSide: Side;
  phase: "start" | "main" | "end";
  player: SideState;
  enemy: SideState;
  field: FieldState | null;
  stability: number;
  corruptionStage: 0 | 1 | 2 | 3 | 4;
  /** v3.3 次元滲透裂縫；undefined 表示尚未開啟（穩定度首次 < 50 時初始化）。 */
  rift?: RiftState;
  log: LogEntry[];
  result: BattleResult;
  endgameReason?: string;
}
