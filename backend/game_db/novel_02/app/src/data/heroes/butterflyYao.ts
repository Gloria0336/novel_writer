import type { HeroDefinition } from "../../core/types/hero";

export const HERO_BUTTERFLY_YAO: HeroDefinition = {
  id: "butterfly-yao",
  name: "曇",
  raceId: "fey",
  classId: "illusionist",
  rarity: "SR",
  statTuning: { hp: -5, atk: -2, def: 0, cmd: 1 },
  gauge: {
    description: "靈蘊最大值 100，不會每回合重置。每回合開始 +4；每施放 1 張法術 +8；每有我方兵力進場 +6。靈蘊用於支付夜鏡之客，並支撐妖族人形/妖形的戰術差異。",
    onTurnStart: 4,
    onSpellCast: 8,
    onTroopEnter: 6,
  },
  passives: [
    {
      id: "psv_scale_dust_memory",
      name: "鱗粉記憶",
      description: "戰鬥開始時為人形。每回合第一次由曇自身技能切換形態時，獲得 6 護甲；若敵方有兵力，使第一個敵方兵力 ATK -2 持續 1 回合，否則抽 1 張牌。",
      cost: {},
      passive: true,
      effects: [{ kind: "scripted", tag: "TAN_FORM_MEMORY" }],
    },
  ],
  actives: [
    {
      id: "act_moonlit_fold",
      name: "月下折頁",
      description: "切換人形/妖形，抽 1 張牌，獲得 8 護甲，靈蘊 +10；觸發鱗粉記憶。（消耗 20 鬥志）",
      cost: { morale: 20 },
      effects: [
        { kind: "scripted", tag: "Y_FORM_TOGGLE" },
        { kind: "scripted", tag: "TAN_FORM_MEMORY" },
        { kind: "draw", count: 1 },
        { kind: "armor", amount: 8 },
        { kind: "gauge", delta: 10, side: "self" },
      ],
    },
    {
      id: "act_chromatic_scale_correction",
      name: "彩粉校色",
      description: "敵方所有兵力 ATK -3 持續 2 回合，並凍結指定敵方兵力 1 回合。（消耗 30 鬥志）",
      cost: { morale: 30 },
      effects: [
        { kind: "buff", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, mod: { atk: -3 }, duration: { kind: "turns", count: 2 } },
        { kind: "freeze", target: { kind: "single", filter: { side: "enemy", entity: "troop" } }, turns: 1 },
      ],
    },
    {
      id: "act_guest_of_night_mirror",
      name: "夜鏡之客",
      description: "依目前形態召喚：人形召 2 幻影，妖形召 1 妖獸；獲得 6 護甲。（消耗 35 鬥志與 30 靈蘊）",
      cost: { morale: 35, gauge: 30 },
      effects: [
        { kind: "scripted", tag: "Y_HUNDRED_GHOSTS" },
        { kind: "armor", amount: 6 },
      ],
    },
  ],
  ultimate: {
    id: "ult_blank_before_pupation",
    name: "破繭前的空白",
    description: "敵方下一回合不恢復魔力且不能打出兵力牌；召喚 2 幻影，回復自身 18 HP，抽 1 張牌。",
    cost: { morale: 100 },
    effects: [
      { kind: "scripted", tag: "TAN_BLANK_BEFORE_PUPATION" },
      { kind: "summon", cardId: "I_PHANTOM", count: 2, side: "self" },
      { kind: "heal", target: { kind: "self" }, amount: { kind: "const", value: 18 } },
      { kind: "draw", count: 1 },
    ],
  },
  flavor: "「也許我會記得，也許只剩這一筆顏色替我記得。」",
};
