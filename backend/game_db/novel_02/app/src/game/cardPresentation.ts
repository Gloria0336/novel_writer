import type { Card, CardType, DeviceCard, Rarity, TroopCard } from "../core/types/card";
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
  displayCost: number;
  costReduced: boolean;
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
  gaugeName?: string;
  effectiveCost?: number;
  artManifest?: CardArtManifest;
}

export const CARD_TYPE_COLOR: Record<CardType, string> = {
  troop: "#86b6a3",
  action: "#d27863",
  spell: "#8ea7d8",
  equipment: "#d3ad58",
  field: "#6fb4c8",
  device: "#b39ddb",
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#a8b0ba",
  uncommon: "#72c98f",
  rare: "#70a7e8",
  legendary: "#e0b45b",
};

export function buildCardFaceModel(card: Card, options: BuildCardFaceModelOptions = {}): CardFaceModel {
  const metaLine = options.metaLine ?? defaultMetaLine(card);
  const effectSource = options.effectLines ?? describeCardEffects(card, { gaugeName: options.gaugeName });
  const effectLines = normalizeEffectLines(
    options.metaLine === undefined ? removeDefaultMetaLineDuplication(effectSource, card) : effectSource,
    card,
  );

  return {
    id: card.id,
    name: card.name,
    cost: card.cost,
    displayCost: options.effectiveCost ?? card.cost,
    costReduced: options.effectiveCost !== undefined && options.effectiveCost < card.cost,
    type: card.type,
    typeLabel: CARD_TYPE_LABEL[card.type],
    typeColor: CARD_TYPE_COLOR[card.type],
    rarity: card.rarity,
    rarityLabel: RARITY_LABEL[card.rarity],
    rarityColor: RARITY_COLOR[card.rarity],
    metaLine,
    effectLines,
    stats: card.type === "troop" || card.type === "device" ? unitStats(card as TroopCard | DeviceCard) : undefined,
    art: resolveCardArt(card.id, options.artManifest),
  };
}

function unitStats(card: TroopCard | DeviceCard): CardFaceStats {
  return { hp: card.hp, atk: card.atk, def: card.def };
}

function defaultMetaLine(card: Card): string | undefined {
  if (card.type !== "field") return undefined;
  switch (card.placement) {
    case "self":
      return "場地 · 己方槽位";
    case "enemy":
      return "場地 · 對方槽位";
    case "either":
      return "場地 · 可指定槽位";
  }
}

function removeDefaultMetaLineDuplication(lines: readonly string[], card: Card): string[] {
  if (card.type !== "field") return [...lines];
  return lines.filter((line) => !line.trim().startsWith("放置："));
}

function normalizeEffectLines(lines: readonly string[], card: Card): string[] {
  const clean = lines.map((line) => line.trim()).filter(Boolean);
  if (clean.length > 0) return clean;
  if (card.flavor) return [card.flavor];
  return [`${CARD_TYPE_LABEL[card.type]} card`];
}
