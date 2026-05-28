import type { HeroDefinition } from "../../core/types/hero";

export const HERO_AELLA_FLAIR: HeroDefinition = {
  id: "aella-flair",
  name: "艾拉·芙萊爾",
  raceId: "human",
  classId: "adventurer",
  rarity: "SSR",
  statTuning: { hp: -2, atk: 4, def: 0, cmd: 1 },
  gauge: {
    description: "每回合開始 +6 軍令；每打出 1 張法術 +4 軍令。艾拉以情報節奏累積戰術優勢。",
    onTurnStart: 6,
    onSpellCast: 4,
  },
  passives: [
    {
      id: "psv_windshear_precognition",
      name: "風切預判",
      description: "艾拉自身永久 ATK +2、DEF +1。每回合開始，若敵方兵力 ≥ 2，對敵方隨機造成 2 次 ATK×0.5 傷害（各自獨立選目標）。",
      cost: {},
      passive: true,
      effects: [
        { kind: "buff", target: { kind: "self" }, mod: { atk: 2, def: 1 }, duration: { kind: "permanent" } },
        { kind: "scripted", tag: "AELLA_WINDSHEAR_READ" },
      ],
    },
  ],
  actives: [
    {
      id: "act_low_altitude_dive",
      name: "低空俯衝",
      description: "對敵方單體造成 ATK ×1.5 傷害，無視守護。（消耗 25 鬥志）",
      cost: { morale: 25 },
      effects: [
        { kind: "damage", target: { kind: "single", filter: { side: "enemy" } }, amount: { kind: "atk", mult: 1.5 }, ignoreGuard: true },
      ],
    },
    {
      id: "act_anomaly_trace",
      name: "異常痕跡偵查",
      description: "抽 2 張牌，獲得 8 護甲，軍令 +10。（消耗 30 鬥志）",
      cost: { morale: 30 },
      effects: [
        { kind: "draw", count: 2 },
        { kind: "armor", amount: 8 },
        { kind: "gauge", delta: 10, side: "self" },
      ],
    },
    {
      id: "act_decoy_marker",
      name: "引敵標記",
      description: "艾拉自身 DEF +8 並獲得守護（嘲諷）2 回合。劃出極亮魔導標記，把敵方注意力全部吸引到自己身上。（消耗 40 鬥志，軍令 25）",
      cost: { morale: 40, gauge: 25 },
      effects: [
        { kind: "buff", target: { kind: "self" }, mod: { def: 8 }, duration: { kind: "turns", count: 2 } },
        { kind: "addKeyword", target: { kind: "self" }, keyword: "guard", duration: { kind: "turns", count: 2 } },
      ],
    },
  ],
  ultimate: {
    id: "ult_twenty_one_minutes",
    name: "二十一分鐘",
    description: "隨機對 3 個敵方目標各造成 16 傷害，無視守護；我方所有兵力恢復 8 HP 並獲得守護 1 回合；自身本回合 ATK +5。",
    cost: { morale: 100 },
    effects: [
      { kind: "damage", target: { kind: "random", filter: { side: "enemy" }, count: 3 }, amount: { kind: "const", value: 16 }, ignoreGuard: true },
      { kind: "heal", target: { kind: "all", filter: { side: "self", entity: "troop" } }, amount: { kind: "const", value: 8 } },
      { kind: "addKeyword", target: { kind: "all", filter: { side: "self", entity: "troop" } }, keyword: "guard", duration: { kind: "turns", count: 1 } },
      { kind: "buff", target: { kind: "self" }, mod: { atk: 5 }, duration: { kind: "thisTurn" } },
    ],
  },
  flavor: "「人齊了嗎？」「齊了。」「那我回來了。」",
};
