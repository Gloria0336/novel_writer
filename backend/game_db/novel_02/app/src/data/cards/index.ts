import type { Card } from "../../core/types/card";
import { TROOPS } from "./troops";
import { ACTIONS } from "./actions";
import { SPELLS } from "./spells";
import { EQUIPMENTS } from "./equipments";
import { FIELDS } from "./fields";
import { NEUTRAL_LEGENDS } from "./neutrals";
import { HUMAN_CARDS } from "./races/human";
import { ELF_CARDS } from "./races/elf";
import { DWARF_CARDS } from "./races/dwarf";
import { FEY_CARDS } from "./races/fey";
import { BEAST_CARDS } from "./races/beast";
import { DEMIGOD_CARDS } from "./races/demigod";
import { INTERNAL_TROOPS } from "./internals";
import { LAIR_TROOPS } from "../enemies/putrefactiveLair";

// 通用 54 張（玩家可組）
export const GENERIC_CARDS: Card[] = [...TROOPS, ...ACTIONS, ...SPELLS, ...EQUIPMENTS, ...FIELDS];

// 中立傳說卡 6 張
export const NEUTRAL_CARDS: Card[] = [...NEUTRAL_LEGENDS];

// 種族卡（每族 10 張，共 60 張）
export const RACE_CARDS: Record<string, Card[]> = {
  human: HUMAN_CARDS,
  elf: ELF_CARDS,
  dwarf: DWARF_CARDS,
  fey: FEY_CARDS,
  beast: BEAST_CARDS,
  demigod: DEMIGOD_CARDS,
};

// 全部玩家可用卡（54 + 60 + 6 = 120 張）
export const ALL_CARDS: Card[] = [
  ...GENERIC_CARDS,
  ...HUMAN_CARDS,
  ...ELF_CARDS,
  ...DWARF_CARDS,
  ...FEY_CARDS,
  ...BEAST_CARDS,
  ...DEMIGOD_CARDS,
  ...NEUTRAL_CARDS,
];

// 內部召喚卡（不在玩家牌組中）+ 巢穴專屬
export const ENEMY_INTERNAL_CARDS: Card[] = [...LAIR_TROOPS, ...INTERNAL_TROOPS];

const CARD_INDEX: Record<string, Card> = Object.fromEntries(
  [...ALL_CARDS, ...ENEMY_INTERNAL_CARDS].map((c) => [c.id, c]),
);

export function getCard(id: string): Card {
  const c = CARD_INDEX[id];
  if (!c) throw new Error(`Unknown card id: ${id}`);
  return c;
}

export { TROOPS, ACTIONS, SPELLS, EQUIPMENTS, FIELDS, NEUTRAL_LEGENDS, HUMAN_CARDS, ELF_CARDS, DWARF_CARDS, FEY_CARDS, BEAST_CARDS, DEMIGOD_CARDS };
