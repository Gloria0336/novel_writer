import type { HeroDefinition } from "../../core/types/hero";

export const HERO_FULDRA: HeroDefinition = {
  id: "fuldra",
  name: "芙爾卓",
  raceId: "beast",
  classId: "commander",
  rarity: "SSR",
  statTuning: { hp: 10, atk: -1, def: 3, cmd: 1 },
  gauge: {
    description: "受傷每 10% +1 血怒；我方兵力被摧毀 +1；自家擊殺敵兵 +1。數百年沙場讓她在最壞局面下最為致命。",
    onHeroDamaged: { perPct: 10, perValue: 1 },
    onTroopDestroyedAlly: 1,
    onTroopDestroyedSelf: 1,
  },
  passives: [
    {
      id: "psv_dragon_blood_legacy",
      name: "龍族血脈",
      description: "芙爾卓自身永久 HP +15、DEF +3、ATK +1。",
      cost: {},
      passive: true,
      effects: [{ kind: "buff", target: { kind: "self" }, mod: { hp: 15, def: 3, atk: 1 }, duration: { kind: "permanent" } }],
    },
    {
      id: "psv_century_battlefield_memory",
      name: "百年戰場記憶",
      description: "每回合開始時，若我方場上有 1+ 兵力，自身獲得 3 護甲。",
      cost: {},
      passive: true,
      effects: [{ kind: "scripted", tag: "FULDRA_VIGIL" }],
    },
  ],
  actives: [
    {
      id: "act_spatial_lock",
      name: "戰線壓制",
      description: "對敵方單體造成 ATK +4 傷害，並使其進入針對狀態 1 回合。（消耗 30 鬥志）",
      cost: { morale: 30 },
      effects: [
        { kind: "damage", target: { kind: "single", filter: { side: "enemy" } }, amount: { kind: "atk", bonus: 4 } },
        { kind: "addStatus", target: { kind: "single", filter: { side: "enemy", entity: "troop" } }, status: "marked", duration: { kind: "turns", count: 1 } },
      ],
    },
    {
      id: "act_dragonbreath_sweep",
      name: "龍息掃蕩",
      description: "對敵方所有兵力造成 ATK 傷害，無視 DEF。（消耗 40 鬥志，血怒 3）",
      cost: { morale: 40, gauge: 3 },
      effects: [{ kind: "damage", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, amount: { kind: "atk", bonus: 0 }, ignoreDef: true }],
    },
    {
      id: "act_northern_fortress_array",
      name: "北方要塞陣列",
      description: "所有我方兵力 2 回合 DEF +3 並獲得守護。（消耗 40 鬥志，血怒 3）",
      cost: { morale: 40, gauge: 3 },
      effects: [
        { kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { def: 3 }, duration: { kind: "turns", count: 2 } },
        { kind: "addKeyword", target: { kind: "all", filter: { side: "self", entity: "troop" } }, keyword: "guard", duration: { kind: "turns", count: 2 } },
      ],
    },
  ],
  ultimate: {
    id: "ult_black_dragon_true_form",
    name: "黑龍真身",
    description: "對敵方英雄造成 ATK ×1.5 + 血怒 ×2 傷害，無視守護；對敵方所有兵力造成 15 傷害，無視 DEF；所有我方兵力 2 回合 ATK +3 / DEF +3；自身回復 20 HP。",
    cost: { morale: 100 },
    effects: [
      { kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "atk", mult: 1.5 }, ignoreGuard: true },
      { kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "rage", mult: 2 }, ignoreGuard: true },
      { kind: "damage", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, amount: { kind: "const", value: 15 }, ignoreDef: true },
      { kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { atk: 3, def: 3 }, duration: { kind: "turns", count: 2 } },
      { kind: "heal", target: { kind: "self" }, amount: { kind: "const", value: 20 } },
    ],
  },
  flavor: "「我守了這片地數百年。短命之物的傷亡，不該由我多看一次。」",
};
