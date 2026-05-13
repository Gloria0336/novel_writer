import type { TroopCard } from "../../../core/types/card";
import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { LairDefinition } from "./types";

/**
 * 暗影門戶 — §E.2
 * HP 150 / DEF 5 / 每 2 回合 1–2 / 兵力守護且 onDestroy 穩定度 -5；
 * 巢穴存活每回合穩定度 -3。
 */
export const LAIR_SHADOW_GATE_ID = "shadow_gate";

const HERO_DEF: HeroDefinition = {
  id: LAIR_SHADOW_GATE_ID,
  name: "暗影門戶",
  raceId: "demon",
  classId: "mage",
  rarity: "R",
  statTuning: {},
  gauge: { description: "巢穴不使用量表" },
  passives: [],
  actives: [],
  ultimate: { id: "noop", name: "—", description: "巢穴沒有終極技", cost: { morale: 9999 }, effects: [] },
  flavor: "次元裂縫不斷擴張，暗影從中傾瀉。",
};

function createInstance(): HeroInstance {
  return {
    defId: LAIR_SHADOW_GATE_ID,
    hp: 150, maxHp: 150,
    atk: 0, def: 5, cmd: 5,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: true, immortalUsed: false, lastSummonTurn: 0 },
  };
}

const SHADOW_DESTROY_STAB: { kind: "stability"; delta: number } = { kind: "stability", delta: -5 };

export const LAIR_SHADOW_TROOPS: TroopCard[] = [
  {
    id: "I_SHADOW_GUARD", type: "troop", name: "暗影守衛",
    cost: 0, rarity: "common",
    hp: 10, atk: 3, def: 2,
    keywords: ["guard"],
    onDestroy: [SHADOW_DESTROY_STAB],
    flavor: "在門戶前列陣的虛影。",
  },
  {
    id: "I_SHADOW_ELITE", type: "troop", name: "暗影精英",
    cost: 0, rarity: "uncommon",
    hp: 14, atk: 6, def: 2,
    keywords: ["guard"],
    onDestroy: [SHADOW_DESTROY_STAB],
    flavor: "穿越次元的精銳。",
  },
  {
    id: "I_SHADOW_LORD", type: "troop", name: "暗影領主",
    cost: 0, rarity: "rare",
    hp: 22, atk: 9, def: 3,
    keywords: ["guard", "pierce"],
    onDestroy: [SHADOW_DESTROY_STAB],
    flavor: "領袖之姿。其穿透無視所有防禦。",
  },
];

export const LAIR_SHADOW_GATE: LairDefinition = {
  id: LAIR_SHADOW_GATE_ID,
  name: "暗影門戶",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "lair_shadow_gate",
  internalTroops: LAIR_SHADOW_TROOPS,
  auraTags: { onEnd: ["SHADOW_TICK"] },
  description: "HP 150 / DEF 5；每 2 回合召喚 1–2 隻精英暗影（守護）。巢穴每回合穩定度 -3。",
};
