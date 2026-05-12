import type { HeroDefinition } from "../../core/types/hero";

export const HERO_AELLA_FLAIR: HeroDefinition = {
  id: "aella_flair",
  name: "艾拉·芙萊爾",
  raceId: "human",
  classId: "adventurer",
  rarity: "SR",
  statTuning: { hp: 0, atk: 0, def: 0, cmd: 0 },
  gauge: {
    description: "部署或召喚兵力 +8 軍令；每回合場上每存活 1 兵力 +3 軍令。快速偵查可額外累積軍令。",
    onTroopEnter: 8,
    onTroopSurvivePerTurn: 3,
  },
  passives: [
    {
      id: "psv_flank_recorder",
      name: "側翼記錄手",
      description: "艾拉擅長在戰場側翼記錄、標記與救援，透過偵查和支援兵力累積軍令。",
      cost: {},
      passive: true,
      effects: [],
    },
  ],
  actives: [
    {
      id: "act_low_altitude_dive",
      name: "低空俯衝",
      description: "對 1 名敵方目標造成 ATK +4 傷害，無視守護。自身獲得 8 護甲。（消耗 25 鬥志）",
      cost: { morale: 25 },
      effects: [
        { kind: "damage", target: { kind: "single", filter: { side: "enemy" } }, amount: { kind: "atk", bonus: 4 }, ignoreGuard: true },
        { kind: "armor", amount: 8 },
      ],
    },
    {
      id: "act_rescue_marker",
      name: "救援標記",
      description: "抽 1 張牌，召喚 1 名持盾衛兵。（消耗 35 鬥志）",
      cost: { morale: 35 },
      effects: [
        { kind: "draw", count: 1 },
        { kind: "summon", cardId: "T03", count: 1, side: "self" },
      ],
    },
    {
      id: "act_rapid_recon",
      name: "快速偵查",
      description: "抽 1 張牌，自身獲得 6 護甲，獲得 10 軍令。（消耗 20 鬥志）",
      cost: { morale: 20 },
      effects: [
        { kind: "draw", count: 1 },
        { kind: "armor", amount: 6 },
        { kind: "gauge", delta: 10, side: "self" },
      ],
    },
  ],
  ultimate: {
    id: "ult_precision_support_guidance",
    name: "精準支援導引",
    description: "敵方所有兵力 DEF 歸零，失去守護與正向增益效果。抽 2 張牌。（消耗 100 鬥志）",
    cost: { morale: 100 },
    effects: [{ kind: "scripted", tag: "PRECISION_SUPPORT_GUIDANCE" }],
  },
  flavor: "「我會標亮目標。支援隊，直接打我的標記。」",
};
