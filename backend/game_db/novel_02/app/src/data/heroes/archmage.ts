import type { HeroDefinition } from "../../core/types/hero";

export const HERO_ARCHMAGE: HeroDefinition = {
  id: "archmage_grand",
  name: "大賢者",
  raceId: "elf",
  classId: "mage",
  rarity: "SR",
  statTuning: { hp: 0, atk: 0, def: 0, cmd: 0 },
  gauge: {
    description: "每施放 1 張法術 +1（每回合重置）；達 4 層觸發詠唱完成（下張法術費用 0）。",
    onSpellCast: 1,
  },
  passives: [
    {
      id: "psv_mana_affinity",
      name: "魔力親和",
      description: "每回合開始額外獲得 1 點臨時魔力。",
      cost: {},
      passive: true,
      effects: [],
    },
  ],
  actives: [
    {
      id: "act_starshackles",
      name: "星辰鎖鏈",
      description: "凍結敵方 1 個兵力 2 回合。無視守護。（消耗 30 鬥志）",
      cost: { morale: 30 },
      effects: [{ kind: "freeze", target: { kind: "single", filter: { side: "enemy", entity: "troop" } }, turns: 2 }],
    },
    {
      id: "act_recall_knowledge",
      name: "知識灌注",
      description: "從棄牌堆回收 2 張法術卡到手牌（MVP：抽 2 張）。（消耗 40 鬥志）",
      cost: { morale: 40 },
      effects: [{ kind: "draw", count: 2 }],
    },
    {
      id: "act_starsight",
      name: "星象預言",
      description: "查看牌庫頂 3 張，選 1 張加入手牌（MVP：直接抽 1）。共鳴 +1。（消耗 20 鬥志）",
      cost: { morale: 20 },
      effects: [
        { kind: "draw", count: 1 },
        { kind: "gauge", delta: 1, side: "self" },
      ],
    },
  ],
  ultimate: {
    id: "ult_ancient_finale",
    name: "古語終章",
    description: "對敵方全體造成（本場已使用法術卡數 ×3）傷害。無視守護。",
    cost: { morale: 100 },
    effects: [
      {
        kind: "damage",
        target: { kind: "all", filter: { side: "enemy" } },
        amount: { kind: "spellsCastThisGame", mult: 3 },
        ignoreGuard: true,
      },
    ],
  },
  flavor: "「古語不止是話語——是宇宙生時，第一道光的形狀。」",
};
