import type { FieldCard } from "../../core/types/card";

// 場地卡：雙方各自有獨立槽位。placement 決定卡片放置到哪一側槽位。
// 槽位方 = 擁有者 = 被作用方。buff/scripted 效果以「自身」為作用對象。
export const FIELDS: FieldCard[] = [
  {
    id: "F_c_01", type: "field", name: "平原", cost: 2, rarity: "common",
    placement: "self",
    effects: [{ kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { atk: 1 }, duration: { kind: "permanent" } }],
  },
  {
    id: "F_c_02", type: "field", name: "密林", cost: 2, rarity: "common",
    placement: "self",
    effects: [{ kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { def: 2 }, duration: { kind: "permanent" } }],
  },
  {
    id: "F_c_03", type: "field", name: "要塞城牆", cost: 3, rarity: "uncommon",
    placement: "self",
    effects: [{ kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { def: 3 }, duration: { kind: "permanent" } }],
  },
  {
    id: "F_c_04", type: "field", name: "魔力節點", cost: 3, rarity: "uncommon",
    placement: "self",
    effects: [{ kind: "scripted", tag: "FIELD_MANA_NODE" }],
  },
  {
    // v3.4：荒蕪焦土改為「自身槽位方每回合燒己方兵力 3 火傷」的自損型場地（搭配天象/戰術機制）。
    id: "F_c_05", type: "field", name: "荒蕪焦土", cost: 4, rarity: "uncommon",
    placement: "self",
    effects: [{ kind: "scripted", tag: "FIELD_BURN" }],
  },
  {
    id: "F_c_06", type: "field", name: "古戰場遺跡", cost: 4, rarity: "rare",
    placement: "self",
    effects: [{ kind: "scripted", tag: "FIELD_RESURRECT" }],
  },
  {
    // 放在對方槽位：每回合燒槽位方首個活躍兵力 6 點傷害。
    id: "F_c_07", type: "field", name: "風暴山脊", cost: 4, rarity: "rare",
    placement: "enemy",
    effects: [{ kind: "scripted", tag: "FIELD_STORM" }],
  },
  {
    id: "F_c_08", type: "field", name: "次元裂縫", cost: 5, rarity: "legendary",
    placement: "self",
    effects: [{ kind: "scripted", tag: "FIELD_DIMENSIONAL_RIFT" }],
  },
];

/** Boss / 巢穴專用的場地卡（不在玩家牌組中）。 */
export const ENEMY_FIELDS: FieldCard[] = [
  {
    // Boss 召喚時寫入「敵方對手槽位」(=玩家方)，每回合燒玩家全兵力 2 火傷。
    id: "F_s_01", type: "field", name: "獄火", cost: 0, rarity: "legendary",
    placement: "enemy",
    effects: [{ kind: "scripted", tag: "FIELD_BURN" }],
    flavor: "炎魔降臨之地，每回合結束時被籠罩方兵力受 2 傷害。",
  },
];
