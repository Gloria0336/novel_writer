import type { TroopCard } from "../../core/types/card";

/**
 * 內部召喚用兵力卡（不放進玩家牌組，僅供其他卡 summon 使用）。
 */
export const INTERNAL_TROOPS: TroopCard[] = [
  // S_f_04 百鬼夜行（人形）召喚的幻影兵力
  { id: "T_s_31", type: "troop", name: "幻影", cost: 0, rarity: "common", hp: 1, atk: 0, def: 0, keywords: ["guard"] },
  // S_f_04 百鬼夜行（妖形）召喚的妖獸
  { id: "T_s_32", type: "troop", name: "妖獸", cost: 0, rarity: "common", hp: 15, atk: 7, def: 3, keywords: ["rush"] },
  // S_l_04 末日倒數的「末日標記」標記兵力
  { id: "T_s_33", type: "troop", name: "末日標記", cost: 0, rarity: "common", hp: 20, atk: 0, def: 0, keywords: [] },
];
