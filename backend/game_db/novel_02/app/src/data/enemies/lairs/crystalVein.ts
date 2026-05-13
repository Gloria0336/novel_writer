import type { TroopCard } from "../../../core/types/card";
import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { LairDefinition } from "./types";

/**
 * 晶體礦脈 — §E.2
 * HP 100 / DEF 8 / 每 3 回合 1 / 衛兵守護；3 個晶體碎片合併為魔像。
 */
export const LAIR_CRYSTAL_VEIN_ID = "crystal_vein";

const HERO_DEF: HeroDefinition = {
  id: LAIR_CRYSTAL_VEIN_ID,
  name: "晶體礦脈",
  raceId: "dwarf",
  classId: "smith",
  rarity: "R",
  statTuning: {},
  gauge: { description: "巢穴不使用量表" },
  passives: [],
  actives: [],
  ultimate: { id: "noop", name: "—", description: "巢穴沒有終極技", cost: { morale: 9999 }, effects: [] },
  flavor: "結晶反射著遙遠的光，礦工的工具不知去向。",
};

function createInstance(): HeroInstance {
  return {
    defId: LAIR_CRYSTAL_VEIN_ID,
    hp: 100, maxHp: 100,
    atk: 0, def: 8, cmd: 5,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: true, immortalUsed: false, lastSummonTurn: 0 },
  };
}

export const LAIR_CRYSTAL_TROOPS: TroopCard[] = [
  {
    id: "I_CRYSTAL_SHARD", type: "troop", name: "晶體碎片",
    cost: 0, rarity: "common",
    hp: 5, atk: 0, def: 4,
    keywords: ["guard"],
    flavor: "三片合一即可組成魔像。",
  },
  {
    id: "I_CRYSTAL_GUARD", type: "troop", name: "晶體衛兵",
    cost: 0, rarity: "uncommon",
    hp: 15, atk: 4, def: 5,
    keywords: ["guard"],
    flavor: "守護礦脈的水晶巨人。",
  },
  {
    id: "I_CRYSTAL_GOLEM", type: "troop", name: "晶體魔像",
    cost: 0, rarity: "rare",
    hp: 35, atk: 10, def: 6,
    keywords: ["guard"],
    flavor: "由三片晶體碎片合成的活體雕像。",
  },
];

export const LAIR_CRYSTAL_VEIN: LairDefinition = {
  id: LAIR_CRYSTAL_VEIN_ID,
  name: "晶體礦脈",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "lair_crystal_vein",
  internalTroops: LAIR_CRYSTAL_TROOPS,
  auraTags: { onEnd: ["CRYSTAL_MERGE"] },
  description: "HP 100 / DEF 8；每 3 回合召喚 1 隻晶體單位。3 個晶體碎片可合併為晶體魔像。",
};
