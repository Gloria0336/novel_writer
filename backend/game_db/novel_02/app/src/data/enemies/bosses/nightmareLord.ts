import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { TroopCard } from "../../../core/types/card";
import type { BossDefinition } from "./types";

/**
 * 夢魔宗主 — §E.1 鏡像模式
 * HP 90 / ATK 10 / DEF 4 / CMD 4
 * 種族 demon / 職業 illusionist
 * 夢幻體（I_PHANTOM_AWE）擁有威壓關鍵字。
 */
export const BOSS_NIGHTMARE_LORD_ID = "boss_nightmare_lord";

const HERO_DEF: HeroDefinition = {
  id: BOSS_NIGHTMARE_LORD_ID,
  name: "夢魔宗主",
  raceId: "demon",
  classId: "illusionist",
  rarity: "SSR",
  statTuning: {},
  gauge: {
    description: "黑暗蝕：每召喚 1 夢幻體 +8；夢幻體被摧毀 +10。",
    onTroopEnter: 8,
    onTroopDestroyedSelf: 10,
  },
  passives: [
    {
      id: "psv_nightmare_aura",
      name: "夢魘氣息",
      description: "場上所有夢幻體獲得威壓（不可被敵方兵力選為目標）。",
      cost: {},
      passive: true,
      effects: [],
    },
  ],
  actives: [
    {
      id: "act_phantom_swarm",
      name: "幻體群襲",
      description: "召喚 1 個夢幻體並對 1 目標造成 6 傷害。（消耗 25 鬥志）",
      cost: { morale: 25 },
      effects: [
        { kind: "summon", cardId: "I_PHANTOM_AWE", count: 1, side: "self" },
        { kind: "damage", target: { kind: "single", filter: { side: "enemy" } }, amount: { kind: "const", value: 6 } },
      ],
    },
    {
      id: "act_mind_chain",
      name: "心靈鎖鏈",
      description: "凍結敵方 1 兵力 2 回合，無視守護。（消耗 30 鬥志）",
      cost: { morale: 30 },
      effects: [{ kind: "freeze", target: { kind: "single", filter: { side: "enemy", entity: "troop" } }, turns: 2 }],
    },
    {
      id: "act_dread_pulse",
      name: "驚懼脈衝",
      description: "對敵方全體造成 5 傷害並降低 -2 ATK 2 回合。（消耗 40 鬥志）",
      cost: { morale: 40 },
      effects: [
        { kind: "damage", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, amount: { kind: "const", value: 5 } },
        { kind: "buff", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, mod: { atk: -2 }, duration: { kind: "turns", count: 2 } },
      ],
    },
  ],
  ultimate: {
    id: "ult_eternal_nightmare",
    name: "永恆夢魘",
    description: "召喚 3 個夢幻體，並對敵方英雄造成 25 傷害無視守護。",
    cost: { morale: 100 },
    effects: [
      { kind: "summon", cardId: "I_PHANTOM_AWE", count: 3, side: "self" },
      { kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "const", value: 25 }, ignoreGuard: true },
    ],
  },
  flavor: "夢與虛無的交界處，他編織千百個無從醒來的夢魘。",
};

function createInstance(): HeroInstance {
  return {
    defId: BOSS_NIGHTMARE_LORD_ID,
    hp: 90, maxHp: 90,
    atk: 10, def: 4, cmd: 4,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: false, immortalUsed: false, lastSummonTurn: 0 },
  };
}

const NIGHTMARE_TROOPS: TroopCard[] = [
  {
    id: "I_PHANTOM_AWE", type: "troop", name: "夢幻體",
    cost: 0, rarity: "uncommon",
    hp: 6, atk: 4, def: 0,
    keywords: ["menace"],
    flavor: "夢魔宗主編織的幻象實體。威壓使之難以被兵力鎖定。",
  },
];

export const BOSS_NIGHTMARE_LORD: BossDefinition = {
  id: BOSS_NIGHTMARE_LORD_ID,
  name: "夢魔宗主",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "boss_nightmare_lord",
  internalTroops: NIGHTMARE_TROOPS,
  description: "HP 90 / ATK 10 / DEF 4 / CMD 4。幻術型 Boss，召喚帶威壓的夢幻體。",
};
