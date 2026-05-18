import type { TroopCard } from "../../../core/types/card";
import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { LairDefinition } from "./types";

/**
 * 晶體礦脈 — §E.2
 * HP 100 / DEF 8 / 每 3 回合 1 / 衛兵守護；3 個晶體碎片合併為魔像
 * 機制：反傷固守、碎而不滅、緩慢強化
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
    id: "I_CRYSTAL_SHARD", name: "晶體碎片",
    type: "troop", rarity: "common", cost: 0,
    hp: 5, atk: 0, def: 4,
    keywords: ["guard"],
    // 碎裂反傷：死亡時對1隻隨機玩家兵力造成2傷害
    onDestroy: [{
      kind: "damage",
      target: { kind: "random", filter: { side: "player", entity: "troop" }, count: 1 },
      amount: { kind: "const", value: 2 },
    }],
    flavor: "三片合一即可組成魔像；被擊碎時迸射晶刃。",
  },
  {
    id: "I_CRYSTAL_GUARD", name: "晶體衛兵",
    type: "troop", rarity: "uncommon", cost: 0,
    hp: 15, atk: 4, def: 5,
    keywords: ["guard"],
    // 每回合結束獲得+1 DEF（最多疊加3層，scripted追蹤）
    onTurnEnd: [{ kind: "scripted", tag: "CRYSTAL_FORTIFY" }],
    flavor: "守護礦脈的水晶巨人，越久越堅不可摧。",
  },
  {
    id: "I_CRYSTAL_GOLEM", name: "晶體魔像",
    type: "troop", rarity: "rare", cost: 0,
    hp: 35, atk: 10, def: 6,
    keywords: ["guard"],
    // 出場自帶3點護甲
    onPlay: [{ kind: "armor", amount: 3 }],
    flavor: "由三片晶體碎片合成的活體雕像，誕生時已披覆晶甲。",
  },
  {
    id: "I_CRYSTAL_SPIKE", name: "晶刃尖刺",
    type: "troop", rarity: "uncommon", cost: 0,
    hp: 6, atk: 8, def: 0,
    keywords: ["pierce"],
    flavor: "礦脈偶爾迸發的攻擊性結晶，穿透力極強但脆弱易碎。",
  },
];

export const LAIR_CRYSTAL_VEIN: LairDefinition = {
  id: LAIR_CRYSTAL_VEIN_ID,
  name: "晶體礦脈",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "lair_crystal_vein",
  internalTroops: LAIR_CRYSTAL_TROOPS,
  auraTags: {
    onEnd: ["CRYSTAL_MERGE", "CRYSTAL_REINFORCE"],
  },
  description: "HP 100 / DEF 8；每 3 回合召喚 1 隻晶體單位。3 個晶體碎片合併為晶體魔像。碎片死亡時對隨機玩家兵力反傷 2。衛兵每回合 DEF +1（最多+3）。魔像出場自帶 3 護甲。每 2 回合礦脈 DEF +1（CRYSTAL_REINFORCE）。",
};
