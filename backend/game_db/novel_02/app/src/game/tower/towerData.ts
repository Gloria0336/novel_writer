import type { FloorEntry, OmenId } from "./types";

/**
 * 30 層樓層表：
 * - 第 5/10/15/20/25/30 為 Boss
 * - 其餘 24 層為巢穴，依照固定循環分布六巢穴
 */
const LAIR_CYCLE = [
  "putrefactive_lair",
  "insect_hive",
  "beast_cave",
  "shadow_gate",
  "crystal_vein",
  "corrupted_temple",
];

const BOSS_PER_TIER = [
  "boss_demon_commander",   // floor 5
  "boss_nightmare_lord",    // floor 10
  "boss_elder_demon",       // floor 15
  "boss_fey_rebel_king",    // floor 20
  "boss_infernal_demon",    // floor 25
  "boss_beast_king",        // floor 30
];

export const FLOOR_TABLE: FloorEntry[] = buildFloorTable();

function buildFloorTable(): FloorEntry[] {
  const out: FloorEntry[] = [];
  let lairIdx = 0;
  let bossIdx = 0;
  for (let floor = 1; floor <= 30; floor++) {
    if (floor % 5 === 0) {
      out.push({ floor, kind: "boss", enemyId: BOSS_PER_TIER[bossIdx++]! });
    } else {
      out.push({ floor, kind: "lair", enemyId: LAIR_CYCLE[lairIdx % LAIR_CYCLE.length]! });
      lairIdx++;
    }
  }
  return out;
}

export function getFloorEntry(floor: number): FloorEntry {
  const e = FLOOR_TABLE[floor - 1];
  if (!e) throw new Error(`Unknown tower floor: ${floor}`);
  return e;
}

export interface OmenDef {
  id: OmenId;
  name: string;
  description: string;
  battleEffect: string;
  durationLabel: string;
  defaultTurns: number;
}

export const OMEN_DEFS: Record<OmenId, OmenDef> = {
  twin_moons: {
    id: "twin_moons",
    name: "雙月同圓",
    description: "雙月並照，場地力量被放大並受到庇護。",
    battleEffect: "雙方場地效果數值與場地傷害 x1.5，且場地不可被摧毀。",
    durationLabel: "5 回合",
    defaultTurns: 5,
  },
  minor_eclipse: {
    id: "minor_eclipse",
    name: "副月凌主月",
    description: "副月遮蔽主月，法術流動受阻，場地紋路變得尖銳。",
    battleEffect: "法術費用 +1；場地 buff/數值修飾額外 +1。",
    durationLabel: "7 回合",
    defaultTurns: 7,
  },
  shard_rain: {
    id: "shard_rain",
    name: "碎片雨",
    description: "月之碎片落下，既有場地可能被擊碎，新的場地難以穩定。",
    battleEffect: "進場時摧毀一方既有場地；持續期間不能放置新場地。",
    durationLabel: "3-9 回合",
    defaultTurns: 6,
  },
  solar_eclipse: {
    id: "solar_eclipse",
    name: "日蝕",
    description: "光暗反轉，場地的傷害脈衝沉寂，增益結構被放大。",
    battleEffect: "場地傷害類效果失效；場地 buff 類數值 x2。",
    durationLabel: "10 回合",
    defaultTurns: 10,
  },
  meteor: {
    id: "meteor",
    name: "流星墜",
    description: "高空隕星逐回合逼近，命中時會撕裂對方場地。",
    battleEffect: "每方回合開始有 1 / 剩餘回合機率摧毀對方場地，並對對方英雄造成 8 傷；命中後天象結束。",
    durationLabel: "6-12 回合",
    defaultTurns: 8,
  },
  spirit_surge: {
    id: "spirit_surge",
    name: "靈潮湧動",
    description: "靈潮灌入地脈，場地能以近乎無成本的方式回應。",
    battleEffect: "放置場地費用變為 0；場地回合開始效果觸發兩次。",
    durationLabel: "4 回合",
    defaultTurns: 4,
  },
};

export const OMEN_LIST: OmenId[] = Object.keys(OMEN_DEFS) as OmenId[];
