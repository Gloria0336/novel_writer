import type { FieldCard } from "../../core/types/card";

// 場地卡的「全體效果」MVP 採近似實作：場地進場時套全體 buff，下次場地切換時由 reducer 負責清除（M3 簡化版本）。
export const FIELDS: FieldCard[] = [
  {
    id: "F01", type: "field", name: "平原", cost: 2, rarity: "common",
    effects: [{ kind: "buff", target: { kind: "all", filter: { side: "all", entity: "troop" } }, mod: { atk: 1 }, duration: { kind: "permanent" } }],
  },
  {
    id: "F02", type: "field", name: "密林", cost: 2, rarity: "common",
    effects: [{ kind: "buff", target: { kind: "all", filter: { side: "all", entity: "troop" } }, mod: { def: 2 }, duration: { kind: "permanent" } }],
  },
  {
    id: "F03", type: "field", name: "要塞城牆", cost: 3, rarity: "uncommon",
    effects: [{ kind: "buff", target: { kind: "all", filter: { side: "all", entity: "troop" } }, mod: { def: 3 }, duration: { kind: "permanent" } }],
  },
  {
    id: "F04", type: "field", name: "魔力節點", cost: 3, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "FIELD_MANA_NODE" }],
  },
  {
    id: "F05", type: "field", name: "荒蕪焦土", cost: 4, rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "FIELD_BURN" }],
  },
  {
    id: "F06", type: "field", name: "古戰場遺跡", cost: 4, rarity: "rare",
    effects: [{ kind: "scripted", tag: "FIELD_RESURRECT" }],
  },
  {
    id: "F07", type: "field", name: "風暴山脊", cost: 4, rarity: "rare",
    effects: [{ kind: "scripted", tag: "FIELD_STORM" }],
  },
  {
    id: "F08", type: "field", name: "次元裂縫", cost: 5, rarity: "legendary",
    effects: [{ kind: "scripted", tag: "FIELD_DIMENSIONAL_RIFT" }],
  },
];

/** Boss / 巢穴專用的場地卡（不在玩家牌組中）。 */
export const ENEMY_FIELDS: FieldCard[] = [
  {
    id: "F_BURN_INFERNO", type: "field", name: "獄火", cost: 0, rarity: "legendary",
    effects: [{ kind: "scripted", tag: "FIELD_BURN" }],
    flavor: "炎魔降臨之地，每回合結束時雙方兵力受 2 傷害。",
  },
];
