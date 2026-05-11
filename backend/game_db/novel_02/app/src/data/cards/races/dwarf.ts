import type { Card } from "../../../core/types/card";

/**
 * 矮人種族卡 D01-D10
 * 設計主軸：器具部署、裝備製造與升級、爐火疊加。
 * MVP：器具直接視為兵力處理（佔兵力槽）。
 */
export const DWARF_CARDS: Card[] = [
  {
    id: "D01", type: "troop", name: "修復無人機", cost: 2, rarity: "common",
    hp: 6, atk: 0, def: 2, keywords: [],
    onTurnEnd: [{ kind: "heal", target: { kind: "all", filter: { side: "self", entity: "troop" } }, amount: { kind: "const", value: 3 } }],
    onPlay: [{ kind: "gauge", delta: 10, side: "self" }],
  },
  {
    id: "D02", type: "spell", name: "急速鍛造", cost: 1, rarity: "common",
    effects: [
      { kind: "scripted", tag: "RAPID_FORGE" },
      { kind: "gauge", delta: 15, side: "self" },
    ],
  },
  {
    id: "D03", type: "spell", name: "合金回收", cost: 2, rarity: "common",
    effects: [
      { kind: "scripted", tag: "ALLOY_RECYCLE" },
      { kind: "gauge", delta: 20, side: "self" },
    ],
  },
  {
    id: "D04", type: "troop", name: "自動哨兵", cost: 3, rarity: "uncommon",
    hp: 15, atk: 4, def: 8, keywords: ["guard"],
    onPlay: [{ kind: "gauge", delta: 20, side: "self" }],
    passive: [{ kind: "scripted", tag: "HERO_DEF_PLUS_2_WHILE_ALIVE" }],
  },
  {
    id: "D05", type: "troop", name: "魔導砲台", cost: 4, rarity: "uncommon",
    hp: 20, atk: 8, def: 6, keywords: [],
    onTurnEnd: [{ kind: "scripted", tag: "AUTO_TURRET_FIRE" }],
    onPlay: [{ kind: "gauge", delta: 20, side: "self" }],
    passive: [{ kind: "scripted", tag: "IMMUNE_SPELL_DAMAGE" }],
  },
  {
    id: "D06", type: "action", name: "礦脈爆破", cost: 3, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "MINEVEIN_BLAST" }],
  },
  {
    id: "D07", type: "spell", name: "矮人麥酒", cost: 2, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "DWARF_ALE" }],
  },
  {
    id: "D08", type: "spell", name: "祖傳圖紋", cost: 4, rarity: "rare",
    effects: [
      { kind: "scripted", tag: "ANCESTRAL_BLUEPRINT" },
      { kind: "gauge", delta: 30, side: "self" },
    ],
  },
  {
    id: "D09", type: "troop", name: "攻城巨砲", cost: 6, rarity: "rare",
    hp: 25, atk: 12, def: 8, keywords: ["siege"],
    onPlay: [
      { kind: "scripted", tag: "DAMAGE_ENEMY_HERO_FIXED", payload: { amount: 10 } },
      { kind: "gauge", delta: 20, side: "self" },
    ],
  },
  {
    id: "D10", type: "equipment", name: "氏族戰錘", cost: 8, rarity: "legendary",
    slot: "weapon", modifiers: { atk: 10 },
    passive: [{ kind: "scripted", tag: "CLAN_WARHAMMER" }],
    onPlay: [{ kind: "gauge", delta: 50, side: "self" }],
  },
];
