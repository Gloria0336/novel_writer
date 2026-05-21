import type { Card } from "../../core/types/card";

/**
 * v3.4 職業限定卡。source code 暫用 `o`（other）承載職業卡容器。
 */
export const CLASS_CARDS: Card[] = [
  {
    id: "A_o_01", type: "action", name: "鋼鐵構裝", cost: 1, rarity: "common",
    effects: [{ kind: "scripted", tag: "O_FORGE_CONSTRUCT" }],
  },
  {
    id: "A_o_02", type: "action", name: "緊急拆解", cost: 0, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "O_EMERGENCY_DISASSEMBLE" }],
  },
  {
    id: "A_o_03", type: "action", name: "構裝升級", cost: 3, rarity: "rare",
    effects: [{ kind: "scripted", tag: "O_CONSTRUCT_UPGRADE" }],
  },
  {
    id: "A_o_04", type: "action", name: "戰術撤退", cost: 3, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "O_TACTICAL_RETREAT" }],
  },
  {
    id: "A_o_05", type: "action", name: "全線換防", cost: 5, rarity: "rare",
    effects: [{ kind: "scripted", tag: "O_FULL_LINE_ROTATION" }],
  },
  {
    id: "A_o_06", type: "action", name: "預備陣形", cost: 2, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "O_RESERVE_FORMATION" }],
  },
];
