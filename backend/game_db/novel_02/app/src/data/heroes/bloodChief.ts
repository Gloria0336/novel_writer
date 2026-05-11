import type { HeroDefinition } from "../../core/types/hero";

export const HERO_BLOOD_CHIEF: HeroDefinition = {
  id: "bloodchief_savage",
  name: "蠻血酋長",
  raceId: "beast",
  classId: "berserker",
  rarity: "SR",
  statTuning: { hp: 0, atk: 0, def: 0, cmd: 0 },
  gauge: {
    description: "每損失 10% HP +1 層；己方兵力被殺 +2 層（最多 10 層）。",
    onTroopDestroyedSelf: 2,
    onHeroDamaged: { perPct: 10, perValue: 1 },
  },
  passives: [
    {
      id: "psv_blood_offering",
      name: "血祭戰吼",
      description: "可對己方兵力血祭（MVP：被動，未開放主動切換）。",
      cost: {},
      passive: true,
      effects: [],
    },
  ],
  actives: [
    {
      id: "act_bite",
      name: "撕咬",
      description: "對 1 目標造成 ATK ×1.5 傷害。血怒 ≥ 5 時改為 ×2。（消耗 20 鬥志）",
      cost: { morale: 20 },
      effects: [{ kind: "damage", target: { kind: "single", filter: {} }, amount: { kind: "atk", mult: 1.5 } }],
    },
    {
      id: "act_war_roar",
      name: "戰嚎",
      description: "自傷 15（不可減免）。獲得 5 層血怒。所有兵力 ATK +3 持續 2 回合。（消耗 50 鬥志）",
      cost: { morale: 50 },
      effects: [
        { kind: "scripted", tag: "SELF_DAMAGE_FIXED", payload: { amount: 15 } },
        { kind: "gauge", delta: 5, side: "self" },
        { kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { atk: 3 }, duration: { kind: "turns", count: 2 } },
      ],
    },
    {
      id: "act_pack_tactics",
      name: "狼群戰術",
      description: "本回合可額外使用 1 張行動卡。（消耗 30 鬥志）",
      cost: { morale: 30 },
      effects: [{ kind: "scripted", tag: "EXTRA_ACTIONS", payload: { count: 1 } }],
    },
  ],
  ultimate: {
    id: "ult_primal_awakening",
    name: "祖獸覺醒",
    description: "對敵方英雄造成 (ATK + 血怒×5) ×2 傷害。無視守護。血怒清零，HP +30%。",
    cost: { morale: 100 },
    effects: [{ kind: "scripted", tag: "PRIMAL_AWAKENING" }],
  },
  flavor: "「祖靈在血裡呼喚。我聽見了——也回應了。」",
};
