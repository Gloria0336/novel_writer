import type { Card } from "../../core/types/card";
import { TROOPS } from "./troops";
import { ACTIONS } from "./actions";
import { SPELLS } from "./spells";
import { EQUIPMENTS } from "./equipments";
import { FIELDS, ENEMY_FIELDS } from "./fields";
import { DEVICES } from "./devices";
import { CLASS_CARDS } from "./classCards";
import { NEUTRAL_LEGENDS } from "./neutrals";
import { HUMAN_CARDS } from "./races/human";
import { ELF_CARDS } from "./races/elf";
import { DWARF_CARDS } from "./races/dwarf";
import { FEY_CARDS } from "./races/fey";
import { BEAST_CARDS } from "./races/beast";
import { DEMIGOD_CARDS } from "./races/demigod";
import { DEMON_CARDS, DEMON_TOKENS } from "./races/demon";
import { INTERNAL_TROOPS } from "./internals";
import { RIFT_INFILTRATOR_CARDS } from "./rift-infiltrators";
import { ALL_ENEMY_INTERNAL_TROOPS } from "../enemies";

// 通用卡（玩家可組）：兵力 + 行動 + 法術 + 裝備 + 場地 + 魔導器具
export const GENERIC_CARDS: Card[] = [...TROOPS, ...ACTIONS, ...SPELLS, ...EQUIPMENTS, ...FIELDS, ...DEVICES];

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

// 全部玩家可用卡（v3.4：通用 110 + 種族 68 + 職業 10 + 中立傳說 6 = 194 張）
export const ALL_CARDS: Card[] = [
  ...GENERIC_CARDS,
  ...HUMAN_CARDS,
  ...ELF_CARDS,
  ...DWARF_CARDS,
  ...FEY_CARDS,
  ...BEAST_CARDS,
  ...DEMIGOD_CARDS,
  ...CLASS_CARDS,
  ...NEUTRAL_CARDS,
];

// 內部召喚卡（不在玩家牌組中）+ 所有敵人巢穴/Boss 兵力池 + 魔族召喚 Token + 敵人場地 + 次元滲透裂縫滲透體（v3.3）
export const ENEMY_INTERNAL_CARDS: Card[] = [...ALL_ENEMY_INTERNAL_TROOPS, ...INTERNAL_TROOPS, ...DEMON_TOKENS, ...ENEMY_FIELDS, ...RIFT_INFILTRATOR_CARDS];

const CARD_INDEX: Record<string, Card> = Object.fromEntries(
  [...ALL_CARDS, ...ENEMY_INTERNAL_CARDS, ...DEMON_CARDS].map((c) => [c.id, c]),
);

export function getCard(id: string): Card {
  const c = CARD_INDEX[id];
  if (!c) throw new Error(`Unknown card id: ${id}`);
  return c;
}

export { TROOPS, ACTIONS, SPELLS, EQUIPMENTS, FIELDS, DEVICES, CLASS_CARDS, NEUTRAL_LEGENDS, HUMAN_CARDS, ELF_CARDS, DWARF_CARDS, FEY_CARDS, BEAST_CARDS, DEMIGOD_CARDS, DEMON_CARDS, DEMON_TOKENS, RIFT_INFILTRATOR_CARDS };
