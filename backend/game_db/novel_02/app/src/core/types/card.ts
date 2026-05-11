import type { Effect, StatModifier } from "./effect";
import type { Keyword } from "./keyword";

export type CardType = "troop" | "action" | "spell" | "equipment" | "field";
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

export interface FieldCard extends CardBase {
  type: "field";
  effects: Effect[];
}

export type Card = TroopCard | ActionCard | SpellCard | EquipmentCard | FieldCard;

export interface CardInstance {
  instanceId: string;
  cardId: string;
}
