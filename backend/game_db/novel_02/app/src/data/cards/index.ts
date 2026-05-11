import type { Card } from "../../core/types/card";
import { TROOPS } from "./troops";
import { ACTIONS } from "./actions";
import { SPELLS } from "./spells";
import { EQUIPMENTS } from "./equipments";
import { FIELDS } from "./fields";
import { LAIR_TROOPS } from "../enemies/putrefactiveLair";

// 通用 54 張（玩家可組）+ 巢穴專屬內部卡
export const ALL_CARDS: Card[] = [...TROOPS, ...ACTIONS, ...SPELLS, ...EQUIPMENTS, ...FIELDS];
export const ENEMY_INTERNAL_CARDS: Card[] = [...LAIR_TROOPS];

const CARD_INDEX: Record<string, Card> = Object.fromEntries(
  [...ALL_CARDS, ...ENEMY_INTERNAL_CARDS].map((c) => [c.id, c]),
);

export function getCard(id: string): Card {
  const c = CARD_INDEX[id];
  if (!c) throw new Error(`Unknown card id: ${id}`);
  return c;
}

export { TROOPS, ACTIONS, SPELLS, EQUIPMENTS, FIELDS };
