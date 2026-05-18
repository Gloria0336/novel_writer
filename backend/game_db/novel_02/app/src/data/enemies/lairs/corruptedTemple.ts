import type { TroopCard } from "../../../core/types/card";
import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { LairDefinition } from "./types";

/**
 * 腐化神殿 — §E.2
 * HP 200 / DEF 3 / 每 2 回合 1 / 祭司存活時巢穴 +5 HP/回合
 * 機制：以死為食、獻祭強化、越殺越強
 */
export const LAIR_CORRUPTED_TEMPLE_ID = "corrupted_temple";

const HERO_DEF: HeroDefinition = {
  id: LAIR_CORRUPTED_TEMPLE_ID,
  name: "腐化神殿",
  raceId: "demon",
  classId: "priest",
  rarity: "R",
  statTuning: {},
  gauge: { description: "巢穴不使用量表" },
  passives: [],
  actives: [],
  ultimate: { id: "noop", name: "—", description: "巢穴沒有終極技", cost: { morale: 9999 }, effects: [] },
  flavor: "古老的祭壇被腐化儀式不斷餵養，越破壞越茁壯。",
};

function createInstance(): HeroInstance {
  return {
    defId: LAIR_CORRUPTED_TEMPLE_ID,
    hp: 200, maxHp: 200,
    atk: 0, def: 3, cmd: 5,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: true, immortalUsed: false, lastSummonTurn: 0 },
  };
}

export const LAIR_CORRUPTED_TROOPS: TroopCard[] = [
  {
    id: "I_TEMPLE_PRIEST", name: "腐化祭司",
    type: "troop", rarity: "uncommon", cost: 0,
    hp: 12, atk: 2, def: 2,
    keywords: ["guard"],
    // 存活時神殿每回合+5 HP（由TEMPLE_PRIEST_HEAL aura驅動）
    // 殉道：死亡時治癒神殿8 HP
    onDestroy: [{ kind: "heal", target: { kind: "enemyHero" }, amount: { kind: "const", value: 8 } }],
    flavor: "誦經之聲不絕，死亡時以最後祈禱滋養神殿。",
  },
  {
    id: "I_TEMPLE_FOLLOWER", name: "腐化信徒",
    type: "troop", rarity: "common", cost: 0,
    hp: 8, atk: 4, def: 1,
    keywords: [],
    // 獻祭：死亡時治癒神殿3 HP並消耗現實穩定度
    onDestroy: [
      { kind: "heal", target: { kind: "enemyHero" }, amount: { kind: "const", value: 3 } },
      { kind: "stability", delta: -2 },
    ],
    flavor: "犧牲自我以滋養神殿，每一次死亡都是奉獻。",
  },
  {
    id: "I_CORRUPT_RELIC", name: "腐爛聖物",
    type: "troop", rarity: "rare", cost: 0,
    hp: 18, atk: 5, def: 3,
    keywords: [],
    // 每回合腐化：對隨機玩家兵力造成2傷害
    onTurnEnd: [{
      kind: "damage",
      target: { kind: "random", filter: { side: "player", entity: "troop" }, count: 1 },
      amount: { kind: "const", value: 2 },
    }],
    onDestroy: [{ kind: "stability", delta: -4 }],
    flavor: "曾經神聖，如今滴落腐液，持續侵蝕一切。",
  },
  {
    id: "I_CORRUPT_DEMON", name: "腐化魔神",
    type: "troop", rarity: "rare", cost: 0,
    hp: 22, atk: 8, def: 2,
    keywords: ["lethal", "menace"],
    // 降臨時神殿回血6；必殺+威壓令玩家極難處理
    onPlay: [{ kind: "heal", target: { kind: "enemyHero" }, amount: { kind: "const", value: 6 } }],
    flavor: "殿中儀式累積的腐化精華凝成此形，任何觸碰皆是終結。",
  },
];

export const LAIR_CORRUPTED_TEMPLE: LairDefinition = {
  id: LAIR_CORRUPTED_TEMPLE_ID,
  name: "腐化神殿",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "lair_corrupted_temple",
  internalTroops: LAIR_CORRUPTED_TROOPS,
  auraTags: {
    onEnd: ["TEMPLE_PRIEST_HEAL", "TEMPLE_SACRIFICE"],
  },
  description: "HP 200 / DEF 3；每 2 回合召喚 1 隻。祭司在場時神殿每回合 +5 HP；祭司死亡額外 +8 HP。信徒死亡治癒神殿 3 HP 並降穩定度 -2。腐爛聖物每回合對隨機玩家兵力造成 2 傷害。腐化魔神具必殺+威壓，出場治癒神殿 6 HP。每個兵力死亡累積獻祭計數，滿5觸發強化（TEMPLE_SACRIFICE）。",
};
