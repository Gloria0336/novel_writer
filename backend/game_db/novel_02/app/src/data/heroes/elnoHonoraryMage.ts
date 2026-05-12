import type { HeroDefinition } from "../../core/types/hero";

export const HERO_ELNO_HONORARY_MAGE: HeroDefinition = {
  id: "elno-honorary-mage",
  name: "艾爾諾老師",
  raceId: "elf",
  classId: "mage",
  rarity: "SSR",
  statTuning: { hp: 5, atk: 1, def: 0, cmd: 3 },
  gauge: {
    description: "每施放 1 張法術 +1 共鳴；艾爾諾以星光魔法修正黑暗能量迴路。",
    onSpellCast: 1,
  },
  passives: [
    {
      id: "psv_court_honorary_mage",
      name: "宮廷榮譽法師",
      description: "每回合開始額外獲得 1 點臨時魔力。",
      cost: {},
      passive: true,
      effects: [{ kind: "mana", delta: 1, temporary: true }],
    },
  ],
  actives: [
    {
      id: "act_star_erasure",
      name: "星光抹除",
      description: "對敵方所有兵力造成 12 傷害，無視 DEF 與守護。（消耗 45 鬥志）",
      cost: { morale: 45 },
      effects: [{ kind: "damage", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, amount: { kind: "const", value: 12 }, ignoreDef: true, ignoreGuard: true }],
    },
    {
      id: "act_black_energy_diagnosis",
      name: "黑暗迴路判讀",
      description: "抽 2 張牌，共鳴 +1。（消耗 35 鬥志）",
      cost: { morale: 35 },
      effects: [
        { kind: "draw", count: 2 },
        { kind: "gauge", delta: 1, side: "self" },
      ],
    },
    {
      id: "act_teacher_correction",
      name: "嚴師修正",
      description: "凍結敵方 1 個兵力 2 回合，並獲得 6 護甲。（消耗 30 鬥志）",
      cost: { morale: 30 },
      effects: [
        { kind: "freeze", target: { kind: "single", filter: { side: "enemy", entity: "troop" } }, turns: 2 },
        { kind: "armor", amount: 6 },
      ],
    },
  ],
  ultimate: {
    id: "ult_starlight_circuit_purge",
    name: "星光迴路淨除",
    description: "對敵方全體造成（本場已使用法術卡數 ×4）傷害，無視守護，並摧毀場地。",
    cost: { morale: 100 },
    effects: [
      { kind: "damage", target: { kind: "all", filter: { side: "enemy" } }, amount: { kind: "spellsCastThisGame", mult: 4 }, ignoreGuard: true },
      { kind: "destroyField" },
    ],
  },
  flavor: "「被黑暗能量侵蝕的生物，不用大腦也可以行動。記住代價。」",
};
