import type { HeroDefinition } from "../../core/types/hero";

export const HERO_ELDR_THORIN: HeroDefinition = {
  id: "eldr-thorin",
  name: "艾德 · 圖林",
  raceId: "dwarf",
  classId: "smith",
  rarity: "R",
  statTuning: { hp: -5, atk: 0, def: -1, cmd: 0 },
  gauge: {
    description: "每打出 1 張裝備牌 +20 爐火；每回合開始 +5。爐火越旺，鋼鐵越能承載重擊。",
    onEquipmentPlay: 20,
    onTurnStart: 5,
  },
  passives: [
    {
      id: "psv_forge_brand",
      name: "爐火印記",
      description: "艾德自身永久 HP +5、DEF +2、ATK +1。",
      cost: {},
      passive: true,
      effects: [{ kind: "buff", target: { kind: "self" }, mod: { hp: 5, def: 2, atk: 1 }, duration: { kind: "permanent" } }],
    },
  ],
  actives: [
    {
      id: "act_heavy_hammer_strike",
      name: "重錘鍛擊",
      description: "對敵方單一兵力造成 ATK +3 傷害。（消耗 25 鬥志）",
      cost: { morale: 25 },
      effects: [{ kind: "damage", target: { kind: "single", filter: { side: "enemy", entity: "troop" } }, amount: { kind: "atk", bonus: 3 } }],
    },
    {
      id: "act_tempered_plate",
      name: "淬鋼護甲",
      description: "獲得 8 護甲，爐火 +15。（消耗 30 鬥志）",
      cost: { morale: 30 },
      effects: [
        { kind: "armor", amount: 8 },
        { kind: "gauge", delta: 15, side: "self" },
      ],
    },
    {
      id: "act_forging_rhythm",
      name: "鍛造節奏",
      description: "抽 1 張牌，所有我方兵力本回合 DEF +2。（消耗 35 鬥志）",
      cost: { morale: 35 },
      effects: [
        { kind: "draw", count: 1 },
        { kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { def: 2 }, duration: { kind: "thisTurn" } },
      ],
    },
  ],
  ultimate: {
    id: "ult_clan_hammer_raised",
    name: "氏族戰錘高舉",
    description: "對敵方英雄造成（ATK +12）傷害，無視守護；自身 ATK +3 永久。",
    cost: { morale: 100 },
    effects: [
      { kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "atk", bonus: 12 }, ignoreGuard: true },
      { kind: "buff", target: { kind: "self" }, mod: { atk: 3 }, duration: { kind: "permanent" } },
    ],
  },
  flavor: "「火焰會記住每一道紋路。鋼鐵會記住每一次落錘。」",
};
