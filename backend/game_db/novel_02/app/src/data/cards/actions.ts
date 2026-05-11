import type { ActionCard } from "../../core/types/card";

export const ACTIONS: ActionCard[] = [
  {
    id: "A01", type: "action", name: "劈斬", cost: 1, rarity: "common",
    effects: [{ kind: "damage", target: { kind: "single", filter: {} }, amount: { kind: "atk", bonus: 3 } }],
  },
  {
    id: "A02", type: "action", name: "盾擊", cost: 2, rarity: "common",
    effects: [
      { kind: "damage", target: { kind: "single", filter: {} }, amount: { kind: "atk" } },
      { kind: "armor", amount: 10 },
    ],
  },
  {
    id: "A03", type: "action", name: "猛攻", cost: 2, rarity: "common",
    effects: [{ kind: "damage", target: { kind: "single", filter: {} }, amount: { kind: "atk", bonus: 6 } }],
  },
  {
    id: "A04", type: "action", name: "鐵壁", cost: 2, rarity: "common",
    effects: [
      { kind: "armor", amount: 20 },
      { kind: "buff", target: { kind: "self" }, mod: { def: 5 }, duration: { kind: "thisTurn" } },
    ],
  },
  {
    id: "A05", type: "action", name: "迴旋斬", cost: 3, rarity: "uncommon",
    effects: [{ kind: "damage", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, amount: { kind: "atk", mult: 0.5 }, ignoreGuard: true }],
  },
  {
    id: "A06", type: "action", name: "致命突刺", cost: 3, rarity: "uncommon",
    effects: [{ kind: "damage", target: { kind: "single", filter: {} }, amount: { kind: "atk", mult: 2 } }],
    postEffects: [{ kind: "scripted", tag: "MORALE_IF_KILLED", payload: { amount: 20 } }],
  },
  {
    id: "A07", type: "action", name: "破甲重擊", cost: 3, rarity: "uncommon",
    effects: [{ kind: "damage", target: { kind: "single", filter: {} }, amount: { kind: "atk", bonus: 5 }, ignoreDef: true }],
  },
  {
    id: "A08", type: "action", name: "奮力一搏", cost: 4, rarity: "rare",
    effects: [
      { kind: "damage", target: { kind: "single", filter: {} }, amount: { kind: "atk", mult: 2 } },
      { kind: "scripted", tag: "SELF_DAMAGE_FIXED", payload: { amount: 10 } },
    ],
  },
  {
    id: "A09", type: "action", name: "全力一擊", cost: 5, rarity: "rare",
    effects: [{ kind: "damage", target: { kind: "single", filter: {} }, amount: { kind: "atk", mult: 3 } }],
    postEffects: [{ kind: "scripted", tag: "DISABLE_ACTION_THIS_TURN" }],
  },
  {
    id: "A10", type: "action", name: "星落之劍", cost: 7, rarity: "legendary",
    effects: [{ kind: "scripted", tag: "STARFALL_BLADE" }],
  },
];
