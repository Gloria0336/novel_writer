import type { TroopCard } from "../../../core/types/card";
import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { LairDefinition } from "./types";

/**
 * 蟲族窩巢 — §E.2
 * HP 100 / DEF 2 / 每回合 2 / 5 個蟲母幼蟲合併為蟲后
 * 機制：蟲群暴增、蟲后指揮
 */
export const LAIR_INSECT_HIVE_ID = "insect_hive";

const HERO_DEF: HeroDefinition = {
  id: LAIR_INSECT_HIVE_ID,
  name: "蟲族窩巢",
  raceId: "demon",
  classId: "commander",
  rarity: "R",
  statTuning: {},
  gauge: { description: "巢穴不使用量表" },
  passives: [],
  actives: [],
  ultimate: { id: "noop", name: "—", description: "巢穴沒有終極技", cost: { morale: 9999 }, effects: [] },
  flavor: "蠕動的孵化坑，蟲母在腐土下產卵不止。",
};

function createInstance(): HeroInstance {
  return {
    defId: LAIR_INSECT_HIVE_ID,
    hp: 100, maxHp: 100,
    atk: 0, def: 2, cmd: 5,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: true, immortalUsed: false },
  };
}

export const LAIR_INSECT_TROOPS: TroopCard[] = [
  {
    id: "I_INSECT_EGG", name: "蟲卵",
    type: "troop", rarity: "common", cost: 0,
    hp: 3, atk: 0, def: 0,
    keywords: [],
    // 擊破孵化：死亡時召喚1隻工蟲
    onDestroy: [{ kind: "summon", cardId: "I_WORKER_BUG", count: 1, side: "self" }],
    flavor: "黏液包覆的脈動小球，被打破時孵化出工蟲。",
  },
  {
    id: "I_WORKER_BUG", name: "工蟲",
    type: "troop", rarity: "common", cost: 0,
    hp: 6, atk: 3, def: 0,
    keywords: ["rush"],
    flavor: "為蟲母而活的勞動體，出場即可攻擊。",
  },
  {
    id: "I_QUEEN_LARVA", name: "蟲母幼體",
    type: "troop", rarity: "common", cost: 0,
    hp: 10, atk: 2, def: 1,
    keywords: [],
    flavor: "尚未孵化的蟲母前身，五體合一方顯真形。",
  },
  {
    id: "I_INSECT_QUEEN", name: "蟲后",
    type: "troop", rarity: "rare", cost: 0,
    hp: 30, atk: 8, def: 3,
    keywords: ["guard"],
    // 每回合產2工蟲；QUEEN_AURA光環由auraTags驅動，確保在場時全場+1ATK
    onTurnEnd: [{ kind: "summon", cardId: "I_WORKER_BUG", count: 2, side: "self" }],
    flavor: "五幼體合體而生的成熟蟲母，源源不斷繁衍蟲群。",
  },
  {
    id: "I_FOOD_BUG", name: "糧蟲",
    type: "troop", rarity: "common", cost: 0,
    hp: 8, atk: 1, def: 1,
    keywords: [],
    // 每回合結束時滋養全場友方；死亡時大量回復
    onTurnEnd: [{ kind: "scripted", tag: "FOOD_BUG_HEAL_TICK" }],
    onDestroy: [{ kind: "scripted", tag: "FOOD_BUG_HEAL_BURST" }],
    flavor: "以自身為糧，存活時滋養群落，死亡時釋放全部精華。",
  },
  {
    id: "I_BEETLE_GUARD", name: "甲蟲衛士",
    type: "troop", rarity: "uncommon", cost: 0,
    hp: 12, atk: 5, def: 4,
    keywords: ["guard"],
    // BEETLE_SHELL：在場時提供全場甲蟲類+1 DEF光環（由auraTags BEETLE_SHELL驅動）
    passive: [{ kind: "scripted", tag: "BEETLE_SHELL" }],
    flavor: "堅甲覆體的衛兵，其存在讓整個蟲群更加難以穿透。",
  },
];

export const LAIR_INSECT_HIVE: LairDefinition = {
  id: LAIR_INSECT_HIVE_ID,
  name: "蟲族窩巢",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "lair_insect_hive",
  internalTroops: LAIR_INSECT_TROOPS,
  auraTags: {
    onStart: ["QUEEN_AURA", "BEETLE_SHELL_AURA"],
    onEnd: ["INSECT_MERGE"],
  },
  description: "HP 100 / DEF 2；每回合召喚 2 隻蟲族。場上 5 隻蟲母幼體合併為蟲后。蟲后每回合額外召喚 2 工蟲，且在場時所有友方兵力 ATK +1。蟲卵被擊破時孵化為工蟲。糧蟲存活每回合回復全場 1 HP，死亡時回復全場 2 HP。",
};
