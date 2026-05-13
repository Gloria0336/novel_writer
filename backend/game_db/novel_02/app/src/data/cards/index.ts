import type { Card } from "../../core/types/card";
import { TROOPS } from "./troops";
import { ACTIONS } from "./actions";
import { SPELLS } from "./spells";
import { EQUIPMENTS } from "./equipments";
import { FIELDS, ENEMY_FIELDS } from "./fields";
import { NEUTRAL_LEGENDS } from "./neutrals";
import { HUMAN_CARDS } from "./races/human";
import { ELF_CARDS } from "./races/elf";
import { DWARF_CARDS } from "./races/dwarf";
import { FEY_CARDS } from "./races/fey";
import { BEAST_CARDS } from "./races/beast";
import { DEMIGOD_CARDS } from "./races/demigod";
import { DEMON_CARDS, DEMON_TOKENS } from "./races/demon";
import { INTERNAL_TROOPS } from "./internals";
import { ALL_ENEMY_INTERNAL_TROOPS } from "../enemies";

// 通用 94 張（玩家可組）
export const GENERIC_CARDS: Card[] = [...TROOPS, ...ACTIONS, ...SPELLS, ...EQUIPMENTS, ...FIELDS];

// 中立傳說卡 6 張
export const NEUTRAL_CARDS: Card[] = [...NEUTRAL_LEGENDS];

// 種族卡（每族 10 張，共 60 張；魔族 20 張為敵方專用）
export const RACE_CARDS: Record<string, Card[]> = {
  human: HUMAN_CARDS,
  elf: ELF_CARDS,
  dwarf: DWARF_CARDS,
  fey: FEY_CARDS,
  beast: BEAST_CARDS,
  demigod: DEMIGOD_CARDS,
};

// 全部玩家可用卡（94 + 60 + 6 = 160 張）
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

// 內部召喚卡（不在玩家牌組中）+ 所有敵人巢穴/Boss 兵力池 + 魔族召喚 Token + 敵人場地
export const ENEMY_INTERNAL_CARDS: Card[] = [...ALL_ENEMY_INTERNAL_TROOPS, ...INTERNAL_TROOPS, ...DEMON_TOKENS, ...ENEMY_FIELDS];

const CARD_INDEX: Record<string, Card> = Object.fromEntries(
  [...ALL_CARDS, ...ENEMY_INTERNAL_CARDS, ...DEMON_CARDS].map((c) => [c.id, c]),
);

export function getCard(id: string): Card {
  const c = CARD_INDEX[id];
  if (!c) throw new Error(`Unknown card id: ${id}`);
  return c;
}

export { TROOPS, ACTIONS, SPELLS, EQUIPMENTS, FIELDS, NEUTRAL_LEGENDS, HUMAN_CARDS, ELF_CARDS, DWARF_CARDS, FEY_CARDS, BEAST_CARDS, DEMIGOD_CARDS, DEMON_CARDS, DEMON_TOKENS };
