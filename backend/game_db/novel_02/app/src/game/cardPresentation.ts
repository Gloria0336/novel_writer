import type { Card, CardType, Rarity, TroopCard } from "../core/types/card";
import { CARD_TYPE_LABEL, RARITY_LABEL, describeCardEffects } from "./gameIndexData";
import { resolveCardArt, type CardArtManifest, type ResolvedCardArt } from "./cardArt";

export interface CardFaceStats {
  hp: number;
  maxHp?: number;
  atk: number;
  def: number;
}

export interface CardFaceModel {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  typeLabel: string;
  typeColor: string;
  rarity: Rarity;
  rarityLabel: string;
  rarityColor: string;
  metaLine?: string;
  effectLines: string[];
  stats?: CardFaceStats;
  art: ResolvedCardArt;
}

export interface BuildCardFaceModelOptions {
  metaLine?: string;
  effectLines?: string[];
  artManifest?: CardArtManifest;
}

export const CARD_TYPE_COLOR: Record<CardType, string> = {
  troop: "#86b6a3",
  action: "#d27863",
  spell: "#8ea7d8",
  equipment: "#d3ad58",
  field: "#6fb4c8",
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#a8b0ba",
  uncommon: "#72c98f",
  rare: "#70a7e8",
  legendary: "#e0b45b",
};

export function buildCardFaceModel(card: Card, options: BuildCardFaceModelOptions = {}): CardFaceModel {
  const effectLines = normalizeEffectLines(options.effectLines ?? describeCardEffects(card), card);

  return {
    id: card.id,
    name: card.name,
    cost: card.cost,
    type: card.type,
    typeLabel: CARD_TYPE_LABEL[card.type],
    typeColor: CARD_TYPE_COLOR[card.type],
    rarity: card.rarity,
    rarityLabel: RARITY_LABEL[card.rarity],
    rarityColor: RARITY_COLOR[card.rarity],
    metaLine: options.metaLine,
    effectLines,
    stats: card.type === "troop" ? troopStats(card as TroopCard) : undefined,
    art: resolveCardArt(card.id, options.artManifest),
  };
}

function troopStats(card: TroopCard): CardFaceStats {
  return { hp: card.hp, atk: card.atk, def: card.def };
}

function normalizeEffectLines(lines: readonly string[], card: Card): string[] {
  const clean = lines.map((line) => line.trim()).filter(Boolean);
  if (clean.length > 0) return clean;
  if (card.flavor) return [card.flavor];
  return [`${CARD_TYPE_LABEL[card.type]} card`];
}
