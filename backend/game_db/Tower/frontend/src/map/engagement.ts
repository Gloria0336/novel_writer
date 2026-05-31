import type { Army, Engagement, HexCoord, Structure, TowerMap } from "../types";
import { coordKey, tileAt } from "./routing";

// Frontend mirror of engine/engagement.py so the sandbox can surface strategic
// combat triggers (army collision / structure assault / control contest) without
// a round trip to the Python engine.  The Python engine remains the source of
// truth; this only previews the same conditions on the generated layout.

function opponent(side: "human" | "monster"): "human" | "monster" {
  return side === "human" ? "monster" : "human";
}

function hexRange(center: HexCoord, radius: number): HexCoord[] {
  const out: HexCoord[] = [];
  for (let dq = -radius; dq <= radius; dq += 1) {
    const lo = Math.max(-radius, -dq - radius);
    const hi = Math.min(radius, -dq + radius);
    for (let dr = lo; dr <= hi; dr += 1) {
      out.push({ q: center.q + dq, r: center.r + dr });
    }
  }
  return out;
}

function controlledTiles(structure: Structure): Set<string> {
  const out = new Set<string>();
  for (const coord of structure.footprint) {
    for (const candidate of hexRange(coord, structure.controlRadius)) {
      out.add(coordKey(candidate));
    }
  }
  return out;
}

function structureAt(map: TowerMap, coord: HexCoord): Structure | undefined {
  const tile = tileAt(map, coord);
  if (!tile || !tile.structureId) return undefined;
  return map.structures.find((item) => item.id === tile.structureId);
}

export function detectEngagements(map: TowerMap, month = 1): Engagement[] {
  const engagements: Engagement[] = [];
  const seen = new Set<string>();

  const push = (
    location: HexCoord,
    attackers: Army[],
    defenders: Army[],
    attackerSide: "human" | "monster" | null,
    defenderSide: "human" | "monster" | null,
    structureId: string | null,
    reason: Engagement["reason"]
  ): void => {
    if (!attackers.length) return;
    if (!defenders.length && !structureId) return;
    const attackerIds = attackers.map((army) => army.id).sort();
    const defenderIds = [...defenders.map((army) => army.id), ...(structureId ? [structureId] : [])].sort();
    const dedupe = `${coordKey(location)}|${attackerIds.join(",")}|${defenderIds.join(",")}`;
    if (seen.has(dedupe)) return;
    seen.add(dedupe);
    engagements.push({
      id: `${coordKey(location)}:${reason}:${engagements.length}`,
      location,
      month,
      attackers: attackerIds,
      defenders: defenders.map((army) => army.id).sort(),
      attackerSide,
      defenderSide,
      structureId,
      reason
    });
  };

  // 1) enemy armies sharing a tile
  const byTile = new Map<string, Army[]>();
  for (const army of map.armies) {
    const tileKey = coordKey(army.position);
    const list = byTile.get(tileKey) ?? [];
    list.push(army);
    byTile.set(tileKey, list);
  }
  for (const armies of byTile.values()) {
    if (new Set(armies.map((army) => army.owner)).size <= 1) continue;
    const attackerSide = [...armies].sort((a, b) => a.owner.localeCompare(b.owner))[0].owner;
    const defenderSide = opponent(attackerSide);
    push(
      armies[0].position,
      armies.filter((army) => army.owner === attackerSide),
      armies.filter((army) => army.owner === defenderSide),
      attackerSide,
      defenderSide,
      null,
      "army_collision"
    );
  }

  // 2) army standing on an enemy-owned structure
  for (const army of map.armies) {
    const structure = structureAt(map, army.position);
    if (structure && structure.owner && structure.owner !== army.owner) {
      push(army.position, [army], [], army.owner, structure.owner, structure.id, "structure_assault");
    }
  }

  // 3) army inside an enemy structure's control radius
  const controlled = map.structures
    .filter((structure) => structure.owner)
    .map((structure) => ({ structure, coords: controlledTiles(structure) }));
  for (const army of map.armies) {
    for (const { structure, coords } of controlled) {
      if (structure.owner !== army.owner && coords.has(coordKey(army.position))) {
        push(army.position, [army], [], army.owner, structure.owner, structure.id, "control_contest");
      }
    }
  }

  return engagements;
}
