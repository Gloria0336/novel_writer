import type { CardInstance } from "./card";
import type { ActiveBuff, HeroInstance } from "./hero";
import type { Keyword } from "./keyword";
import type { FreezeEffectName, Side } from "./effect";
import type { RiftState } from "./rift";
import type { ActiveStatusBuff } from "./status";
import type { OmenInstance } from "./omen";

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
  frozenDisplayName?: FreezeEffectName;
  buffs: ActiveBuff[];
  keywordBuffs?: ActiveKeywordBuff[];
  statusBuffs?: ActiveStatusBuff[];
  /** v3.3 滲透體標記：true 時擊殺者獲 +10 鬥志（不是 +15 一般擊殺）。 */
  fromRift?: boolean;
  /** Device 標記：cardId 對應的卡是 DeviceCard。 */
  isDevice?: boolean;
  /** Device 當前型態（僅 isDevice 且 card.form 存在時有意義）。 */
  deviceForm?: "idle" | "active";
  /** Device 升級層級（僅 isDevice 時有意義）。 */
  upgradeLevel?: number;
  /** v3.4 幻影標記：不可攻擊，並會在壽命歸零時自動消散。 */
  isPhantom?: boolean;
  /** v3.4 幻影剩餘壽命，於控制者回合結束時遞減。 */
  phantomTurnsRemaining?: number;
  /** v3.4 鍛造構造物標記：不可治療、不觸發謝幕曲。 */
  isConstruct?: boolean;
  /** v3.4 無死亡副作用標記：用於幻影消散與構裝體拆解。 */
  suppressDestroyEffects?: boolean;
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
  /** v3.4 人類前線第六格；不佔一般兵力欄，最多 1 個。 */
  frontlineSlot?: TroopInstance | null;
  spellsCastThisTurn: number;
  spellsCastThisGame: number;
  /** 已摧毀的魔導器具堆，用於 DEVICE_REBUILD_FROM_GRAVEYARD 復活機制。 */
  destroyedDevices?: CardInstance[];
}

/**
 * 場地槽位狀態。槽位本身（player/enemy）即代表擁有者；場地效果作用於擁有者所在那一方。
 */
export interface FieldState {
  cardId: string;
}

export interface FieldSlots {
  player: FieldState | null;
  enemy: FieldState | null;
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
  /** 場地槽位：雙方各自獨立一格，槽位方即擁有者與被作用方。 */
  field: FieldSlots;
  /** 戰鬥內生效中的天象，由 TowerRun.activeOmen 在戰鬥開始時複製進來。 */
  omen: OmenInstance | null;
  stability: number;
  corruptionStage: 0 | 1 | 2 | 3 | 4;
  /** v3.3 次元滲透裂縫；undefined 表示尚未開啟（穩定度首次 < 50 時初始化）。 */
  rift?: RiftState;
  log: LogEntry[];
  result: BattleResult;
  endgameReason?: string;
}
