import type { Effect, StatModifier } from "./effect";
import type { Keyword } from "./keyword";

export type CardType = "troop" | "action" | "spell" | "equipment" | "field" | "device";
export type Rarity = "common" | "uncommon" | "rare" | "legendary";
export type EquipSlot = "weapon" | "armor" | "trinket";

export interface CardBase {
  id: string;
  name: string;
  cost: number;
  rarity: Rarity;
  flavor?: string;
}

export interface TroopCard extends CardBase {
  type: "troop";
  hp: number;
  atk: number;
  def: number;
  keywords: Keyword[];
  onPlay?: Effect[];
  onDestroy?: Effect[];
  onTurnStart?: Effect[];
  onTurnEnd?: Effect[];
  passive?: Effect[];
}

export interface ActionCard extends CardBase {
  type: "action";
  effects: Effect[];
  postEffects?: Effect[];
}

export interface SpellCard extends CardBase {
  type: "spell";
  effects: Effect[];
}

export interface EquipmentCard extends CardBase {
  type: "equipment";
  slot: EquipSlot;
  modifiers: StatModifier;
  onPlay?: Effect[];
  passive?: Effect[];
}

/**
 * 場地牌放置位置：
 * - "self": 放置到施放方自己的槽位，效果作用於施放方（如 F_c_01 平原 +1 ATK 給己方）
 * - "enemy": 放置到對方槽位，效果作用於對方（如 F_c_07 風暴山脊 燒對方兵力）
 * - "either": 由 UI 在施放時指定 targetSide（目前未啟用，預留擴充）
 */
export type FieldPlacement = "self" | "enemy" | "either";

export interface FieldCard extends CardBase {
  type: "field";
  placement: FieldPlacement;
  effects: Effect[];
}

/**
 * 魔導器具卡（device）— 跨種族的奧術工程產物。
 * 與 TroopCard 同樣佔用 troopSlots，但具備獨立 type 識別與專屬機制：
 * - form：兩態切換（待機/啟動），影響 stat 與 keyword
 * - upgradeable：可被升級（提升 HP/ATK/DEF 永久 +X）
 * - onTurnStart：回合開始自動觸發效果（與 onTurnEnd 互補）
 * - onReaction：對特定事件自動反應
 */
export interface DeviceForm {
  atk: number;
  def: number;
  hp?: number;
  keywords?: Keyword[];
  passive?: Effect[];
}

export type ReactionEvent =
  | "enemySpellCast"
  | "enemyHeroAttacked"
  | "allyTroopDestroyed"
  | "enemyEquipmentPlayed";

export interface ReactionTrigger {
  on: ReactionEvent;
  effects: Effect[];
}

export interface DeviceCard extends CardBase {
  type: "device";
  hp: number;
  atk: number;
  def: number;
  keywords: Keyword[];
  /** 顯式標註：device 仍佔用 troopSlots（與 troop 共用戰場欄位）。 */
  occupiesTroopSlot: true;
  /** 型態變化：基礎型↔強化型；未指定則無型態切換能力。 */
  form?: { idle: DeviceForm; active: DeviceForm };
  /** 可升級規格：每層升級套用的數值加成與封頂層數。 */
  upgradeable?: { maxLevel: number; perLevel: StatModifier };
  onPlay?: Effect[];
  onDestroy?: Effect[];
  onTurnStart?: Effect[];
  onTurnEnd?: Effect[];
  onReaction?: ReactionTrigger[];
  passive?: Effect[];
}

export type Card = TroopCard | ActionCard | SpellCard | EquipmentCard | FieldCard | DeviceCard;

/** 戰場單位卡：troop 與 device 共用 troopSlots，戰鬥系統一致。 */
export type BoardUnitCard = TroopCard | DeviceCard;

export function isBoardUnitCard(card: Card): card is BoardUnitCard {
  return card.type === "troop" || card.type === "device";
}

export function isDeviceCardType(card: Card): card is DeviceCard {
  return card.type === "device";
}

export interface CardInstance {
  instanceId: string;
  cardId: string;
}
