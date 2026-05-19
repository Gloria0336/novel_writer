import type { Card } from "../../../core/types/card";

/**
 * 矮人種族卡 S_dw_01 / A_dw_01–S_dw_03 / E_dw_01–T_dw_02
 * 設計主軸：爐火操作、裝備強化、氏族羈絆、礦山地形、麥酒/宴會。
 *
 * v3.4 重構：原 D01/D04/D05/D09（修復無人機/自動哨兵/魔導砲台/攻城巨砲）
 * 已下放為通用「魔導系列」器具卡 T_m_01–T_m_04（見 devices.ts），矮人不再壟斷器具池。
 * 原 D03 合金回收 → 通用法術 S_c_17 拆解術。
 * 新增 T_dw_01 山王衛兵 / S_dw_04 鍛爐祝禱 / S_dw_05 氏族飲宴 / F_dw_01 深山礦坑 / T_dw_02 鋼鬚鍛師
 * 共保留 10 張矮人專屬卡（5 留 + 5 新）。
 */
export const DWARF_CARDS: Card[] = [
  {
    id: "S_dw_01", type: "spell", name: "急速鍛造", cost: 1, rarity: "common",
    effects: [
      { kind: "scripted", tag: "RAPID_FORGE" },
      { kind: "gauge", delta: 15, side: "self" },
    ],
  },
  {
    id: "A_dw_01", type: "action", name: "礦脈爆破", cost: 3, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "MINEVEIN_BLAST" }],
  },
  {
    id: "S_dw_02", type: "spell", name: "矮人麥酒", cost: 2, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "DWARF_ALE" }],
  },
  {
    id: "S_dw_03", type: "spell", name: "祖傳圖紋", cost: 4, rarity: "rare",
    effects: [
      { kind: "scripted", tag: "ANCESTRAL_BLUEPRINT" },
      { kind: "gauge", delta: 30, side: "self" },
    ],
  },
  {
    id: "E_dw_01", type: "equipment", name: "氏族戰錘", cost: 8, rarity: "legendary",
    slot: "weapon", modifiers: { atk: 10 },
    passive: [{ kind: "scripted", tag: "CLAN_WARHAMMER" }],
    onPlay: [{ kind: "gauge", delta: 50, side: "self" }],
  },
  // ---- v3.4 新增：純矮人文化向 ----
  {
    id: "T_dw_01", type: "troop", name: "山王衛兵", cost: 3, rarity: "uncommon",
    hp: 18, atk: 4, def: 6, keywords: ["guard"],
    passive: [{ kind: "scripted", tag: "MOUNTAIN_KING_GUARD" }],
    flavor: "他守的不是國王，是山。",
  },
  {
    id: "S_dw_04", type: "spell", name: "鍛爐祝禱", cost: 2, rarity: "common",
    effects: [
      { kind: "gauge", delta: 30, side: "self" },
      { kind: "scripted", tag: "FORGE_BENEDICTION" },
    ],
    flavor: "「願爐火記得你的手。」——矮人鍛師對學徒的第一句話。",
  },
  {
    id: "S_dw_05", type: "spell", name: "氏族飲宴", cost: 3, rarity: "uncommon",
    effects: [
      { kind: "scripted", tag: "CLAN_FEAST" },
      { kind: "morale", delta: 15 },
    ],
    flavor: "鬍鬚泡進酒，鋼鐵就此甦醒。",
  },
  {
    id: "F_dw_01", type: "field", name: "深山礦坑", cost: 4, rarity: "uncommon",
    effects: [
      { kind: "scripted", tag: "FIELD_DEEP_MINE" },
      { kind: "gauge", delta: 10, side: "self" },
    ],
    flavor: "他們挖了三百年，挖到一座宮殿，又挖出第二座。",
  },
  {
    id: "T_dw_02", type: "troop", name: "鋼鬚鍛師", cost: 4, rarity: "rare",
    hp: 16, atk: 5, def: 4, keywords: [],
    onPlay: [{ kind: "scripted", tag: "STEELBEARD_SEARCH" }],
    passive: [{ kind: "scripted", tag: "STEELBEARD_FURY" }],
    flavor: "他打鐵時不唱歌——他用每一下落錘代替歌詞。",
  },
];
