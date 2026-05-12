import type { HeroDefinition } from "../../core/types/hero";

export const HERO_MOUNTAIN_HUNTER: HeroDefinition = {
  id: "mountain-hunter",
  name: "山獵人",
  raceId: "human",
  classId: "adventurer",
  rarity: "SR",
  statTuning: { hp: 0, atk: 3, def: 1, cmd: -2 },
  gauge: {
    description: "部署兵力 +6；場上每存活 1 兵力每回合 +3。獵人用山勢與骨箭累積戰術節奏。",
    onTroopEnter: 6,
    onTroopSurvivePerTurn: 3,
  },
  passives: [
    {
      id: "psv_silent_pursuit",
      name: "無聲追跡",
      description: "山獵人自身 ATK +1、DEF +1。",
      cost: {},
      passive: true,
      effects: [{ kind: "buff", target: { kind: "self" }, mod: { atk: 1, def: 1 }, duration: { kind: "permanent" } }],
    },
  ],
  actives: [
    {
      id: "act_bone_arrow_blind",
      name: "骨箭盲射",
      description: "對敵方 1 個兵力造成 12 傷害，無視 DEF 與守護，並凍結 1 回合。（消耗 30 鬥志）",
      cost: { morale: 30 },
      effects: [
        { kind: "damage", target: { kind: "single", filter: { side: "enemy", entity: "troop" } }, amount: { kind: "const", value: 12 }, ignoreDef: true, ignoreGuard: true },
        { kind: "freeze", target: { kind: "single", filter: { side: "enemy", entity: "troop" } }, turns: 1 },
      ],
    },
    {
      id: "act_mountain_reposition",
      name: "山地換位",
      description: "抽 1 張牌，獲得 10 護甲，軍令 +10。（消耗 25 鬥志）",
      cost: { morale: 25 },
      effects: [
        { kind: "draw", count: 1 },
        { kind: "armor", amount: 10 },
        { kind: "gauge", delta: 10, side: "self" },
      ],
    },
    {
      id: "act_tachi_cleave",
      name: "太刀斷筋",
      description: "對敵方單體造成 ATK ×2 傷害，無視 DEF。（消耗 45 鬥志）",
      cost: { morale: 45 },
      effects: [{ kind: "damage", target: { kind: "single", filter: { side: "enemy" } }, amount: { kind: "atk", mult: 2 }, ignoreDef: true }],
    },
  ],
  ultimate: {
    id: "ult_lakehead_execution",
    name: "湖畔斬首",
    description: "對敵方所有兵力造成 25 傷害，無視 DEF；再對敵方英雄造成 ATK ×2 傷害。",
    cost: { morale: 100 },
    effects: [
      { kind: "damage", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, amount: { kind: "const", value: 25 }, ignoreDef: true, ignoreGuard: true },
      { kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "atk", mult: 2 }, ignoreGuard: true },
    ],
  },
  flavor: "晨霧未散，他已踏進山裡；刀出鞘時，妖物才知道懸賞到了。",
};
