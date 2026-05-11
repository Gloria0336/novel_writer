import { useMemo } from "react";
import { getCard } from "../data/cards";
import type { Card } from "../core/types/card";

export function useCard(cardId: string): Card {
  return useMemo(() => getCard(cardId), [cardId]);
}

export function describeCardCost(card: Card): string {
  return `${card.cost}`;
}

export function cardTypeLabel(t: Card["type"]): string {
  switch (t) {
    case "troop": return "兵力";
    case "action": return "行動";
    case "spell": return "法術";
    case "equipment": return "裝備";
    case "field": return "場地";
  }
}

export function cardTypeColor(t: Card["type"]): string {
  switch (t) {
    case "troop": return "#9aa";
    case "action": return "#c66";
    case "spell": return "#a6c";
    case "equipment": return "#c93";
    case "field": return "#69c";
  }
}
