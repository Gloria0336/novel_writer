import type { TroopCard } from "../../../core/types/card";
import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { LairDefinition } from "./types";

/**
 * 蟲族窩巢 — §E.2
 * HP 100 / DEF 2 / 每回合 2 / 5 個蟲母幼蟲合併為蟲后。
 */
export const LAIR_INSECT_HIVE_ID = "insect_hive";

const HERO_DEF: HeroDefinition = {
  id: LAIR_INSECT_HIVE_ID,
  name: "蟲族窩巢",
  raceId: "human",
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

const BASE = {
  type: "troop" as const,
  rarity: "common" as const,
  cost: 0,
  keywords: [],
};

export const LAIR_INSECT_TROOPS: TroopCard[] = [
  {
    ...BASE,
    id: "I_INSECT_EGG", name: "蟲卵",
    hp: 4, atk: 1, def: 0,
    flavor: "黏液包覆的脈動小球。",
  },
  {
    ...BASE,
    id: "I_WORKER_BUG", name: "工蟲",
    hp: 7, atk: 3, def: 0,
    flavor: "為蟲母而活的勞動體。",
  },
  {
    ...BASE,
    id: "I_QUEEN_LARVA", name: "蟲母幼體",
    hp: 10, atk: 2, def: 1,
    flavor: "尚未孵化的蟲母前身。",
  },
  {
    ...BASE,
    id: "I_INSECT_QUEEN", name: "蟲后",
    hp: 30, atk: 8, def: 3,
    keywords: ["guard"],
    flavor: "五幼體合體而生的成熟蟲母。",
  },
];

export const LAIR_INSECT_HIVE: LairDefinition = {
  id: LAIR_INSECT_HIVE_ID,
  name: "蟲族窩巢",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "lair_insect_hive",
  internalTroops: LAIR_INSECT_TROOPS,
  auraTags: { onEnd: ["INSECT_MERGE"] },
  description: "HP 100 / DEF 2；每回合召喚 2 隻蟲族。場上 5 隻蟲母幼體會合併為蟲后。",
};
