import type { TroopCard } from "../../../core/types/card";
import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { LairDefinition } from "./types";

/**
 * 暗影門戶 — §E.2
 * HP 150 / DEF 5 / 每 2 回合 1–2 / 兵力守護且 onDestroy 穩定度 -5；
 * 巢穴存活每回合穩定度 -3；SHADOW_VEIL 使門戶開啟時玩家施法費用+1。
 */
export const LAIR_SHADOW_GATE_ID = "shadow_gate";

const HERO_DEF: HeroDefinition = {
  id: LAIR_SHADOW_GATE_ID,
  name: "暗影門戶",
  raceId: "demon",
  classId: "mage",
  rarity: "R",
  statTuning: {},
  gauge: { description: "巢穴不使用量表" },
  passives: [],
  actives: [],
  ultimate: { id: "noop", name: "—", description: "巢穴沒有終極技", cost: { morale: 9999 }, effects: [] },
  flavor: "次元裂縫不斷擴張，暗影從中傾瀉。",
};

function createInstance(): HeroInstance {
  return {
    defId: LAIR_SHADOW_GATE_ID,
    hp: 150, maxHp: 150,
    atk: 0, def: 5, cmd: 5,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: true, immortalUsed: false, lastSummonTurn: 0 },
  };
}

const SHADOW_DESTROY_STAB: { kind: "stability"; delta: number } = { kind: "stability", delta: -5 };

export const LAIR_SHADOW_TROOPS: TroopCard[] = [
  {
    id: "I_SHADOW_GUARD", name: "暗影守衛",
    type: "troop", rarity: "common", cost: 0,
    hp: 10, atk: 3, def: 2,
    keywords: ["guard"],
    onDestroy: [SHADOW_DESTROY_STAB],
    flavor: "在門戶前列陣的虛影，死亡時撕裂現實壁壘。",
  },
  {
    id: "I_SHADOW_ELITE", name: "暗影精英",
    type: "troop", rarity: "uncommon", cost: 0,
    hp: 14, atk: 6, def: 2,
    keywords: ["guard", "pierce"],
    onDestroy: [SHADOW_DESTROY_STAB],
    flavor: "穿越次元的精銳，守護的同時能無視敵方防線直擊要害。",
  },
  {
    id: "I_SHADOW_LORD", name: "暗影領主",
    type: "troop", rarity: "rare", cost: 0,
    hp: 22, atk: 9, def: 3,
    keywords: ["guard", "pierce"],
    onPlay: [{ kind: "summon", cardId: "I_SHADOW_GUARD", count: 1, side: "self" }],
    onDestroy: [SHADOW_DESTROY_STAB],
    flavor: "領袖降臨即召喚守衛，死亡時對現實造成最深的裂傷。",
  },
  {
    id: "I_SHADOW_ASSASSIN", name: "虛影刺客",
    type: "troop", rarity: "rare", cost: 0,
    hp: 8, atk: 11, def: 0,
    keywords: ["menace", "pierce"],
    onDestroy: [{ kind: "stability", delta: -6 }],
    flavor: "無形無影，無法被鎖定，只有在它消滅時才感受到它曾存在過。",
  },
];

export const LAIR_SHADOW_GATE: LairDefinition = {
  id: LAIR_SHADOW_GATE_ID,
  name: "暗影門戶",
  heroDef: HERO_DEF,
  createInstance,
  profileId: "lair_shadow_gate",
  internalTroops: LAIR_SHADOW_TROOPS,
  auraTags: {
    onStart: ["SHADOW_VEIL"],
    onEnd: ["SHADOW_TICK"],
  },
  description: "HP 150 / DEF 5；每 2 回合召喚 1–2 隻暗影。巢穴每回合穩定度 -3。暗影精英具穿透。暗影領主出場時召喚 1 守衛。虛影刺客具威壓（無法被指定），死亡穩定度 -6。場上 3+ 暗影時玩家法術費用 +1（SHADOW_VEIL）。",
};
