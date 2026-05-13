import type { Effect } from "../../core/types/effect";
import type { HeroDefinition, HeroInstance } from "../../core/types/hero";
import type { TroopCard } from "../../core/types/card";
import { LAIR_LIST, LAIRS } from "./lairs";
import { BOSS_LIST, BOSSES } from "./bosses";

export interface EnemyDefinition {
  id: string;
  kind: "boss" | "lair";
  name: string;
  heroDef: HeroDefinition;
  createInstance: () => HeroInstance;
  profileId: string;
  onBattleStart?: Effect[];
  internalTroops?: TroopCard[];
  auraTags?: { onStart?: string[]; onEnd?: string[] };
  description: string;
}

function lairToEnemy(l: typeof LAIR_LIST[number]): EnemyDefinition {
  return {
    id: l.id,
    kind: "lair",
    name: l.name,
    heroDef: l.heroDef,
    createInstance: l.createInstance,
    profileId: l.profileId,
    internalTroops: l.internalTroops,
    auraTags: l.auraTags,
    description: l.description,
  };
}

function bossToEnemy(b: typeof BOSS_LIST[number]): EnemyDefinition {
  return {
    id: b.id,
    kind: "boss",
    name: b.name,
    heroDef: b.heroDef,
    createInstance: b.createInstance,
    profileId: b.profileId,
    onBattleStart: b.onBattleStart,
    internalTroops: b.internalTroops,
    description: b.description,
  };
}

export const ENEMY_LIST: EnemyDefinition[] = [
  ...LAIR_LIST.map(lairToEnemy),
  ...BOSS_LIST.map(bossToEnemy),
];

export const ENEMIES: Record<string, EnemyDefinition> = Object.fromEntries(ENEMY_LIST.map((e) => [e.id, e]));

export function getEnemy(id: string): EnemyDefinition {
  const e = ENEMIES[id];
  if (!e) throw new Error(`Unknown enemy: ${id}`);
  return e;
}

/** 所有巢穴/Boss 內部兵力卡聚合 — 給 card index 使用。 */
export const ALL_ENEMY_INTERNAL_TROOPS: TroopCard[] = ENEMY_LIST
  .flatMap((e) => e.internalTroops ?? []);

export { LAIRS, BOSSES, LAIR_LIST, BOSS_LIST };
