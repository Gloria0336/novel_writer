import type { LairDefinition } from "./types";
import { LAIR_PUTREFACTIVE } from "./putrefactive";
import { LAIR_INSECT_HIVE } from "./insectHive";
import { LAIR_BEAST_CAVE } from "./beastCave";
import { LAIR_SHADOW_GATE } from "./shadowGate";
import { LAIR_CRYSTAL_VEIN } from "./crystalVein";
import { LAIR_CORRUPTED_TEMPLE } from "./corruptedTemple";

export const LAIR_LIST: LairDefinition[] = [
  LAIR_PUTREFACTIVE,
  LAIR_INSECT_HIVE,
  LAIR_BEAST_CAVE,
  LAIR_SHADOW_GATE,
  LAIR_CRYSTAL_VEIN,
  LAIR_CORRUPTED_TEMPLE,
];

export const LAIRS: Record<string, LairDefinition> = Object.fromEntries(LAIR_LIST.map((l) => [l.id, l]));

export {
  LAIR_PUTREFACTIVE,
  LAIR_INSECT_HIVE,
  LAIR_BEAST_CAVE,
  LAIR_SHADOW_GATE,
  LAIR_CRYSTAL_VEIN,
  LAIR_CORRUPTED_TEMPLE,
};
export type { LairDefinition };
