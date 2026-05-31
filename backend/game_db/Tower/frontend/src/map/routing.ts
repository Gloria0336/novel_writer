import type { Army, HexCoord, HexTile, TowerMap, OwnerSide } from "../types";

const DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 }
];

function key(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

export function coordKey(coord: HexCoord): string {
  return key(coord);
}

export function tileAt(map: TowerMap, coord: HexCoord): HexTile | undefined {
  return map.tileMap.tiles.find((tile) => tile.coord.q === coord.q && tile.coord.r === coord.r);
}

export function tileNeighbors(map: TowerMap, coord: HexCoord): HexTile[] {
  return DIRECTIONS.map((direction) => tileAt(map, { q: coord.q + direction.q, r: coord.r + direction.r })).filter(
    (tile): tile is HexTile => Boolean(tile)
  );
}

export function findTileRoute(map: TowerMap, start: HexCoord, end: HexCoord): HexCoord[] | null {
  const startKey = key(start);
  const endKey = key(end);
  const distances = new Map<string, number>([[startKey, 0]]);
  const previous = new Map<string, string>();
  const queue = new Set(map.tileMap.tiles.filter((tile) => tile.passable).map((tile) => key(tile.coord)));

  while (queue.size) {
    let current = "";
    let best = Number.POSITIVE_INFINITY;
    for (const item of queue) {
      const distance = distances.get(item) ?? Number.POSITIVE_INFINITY;
      if (distance < best) {
        current = item;
        best = distance;
      }
    }
    if (!current || best === Number.POSITIVE_INFINITY) break;
    queue.delete(current);
    if (current === endKey) break;
    const [q, r] = current.split(",").map(Number);
    for (const neighbor of tileNeighbors(map, { q, r }).filter((tile) => tile.passable)) {
      const neighborKey = key(neighbor.coord);
      if (!queue.has(neighborKey)) continue;
      const candidate = best + neighbor.movementCost;
      if (candidate < (distances.get(neighborKey) ?? Number.POSITIVE_INFINITY)) {
        distances.set(neighborKey, candidate);
        previous.set(neighborKey, current);
      }
    }
  }

  if (!previous.has(endKey) && startKey !== endKey) return null;
  const path: HexCoord[] = [end];
  let cursor = endKey;
  while (cursor !== startKey) {
    const prev = previous.get(cursor);
    if (!prev) return null;
    const [q, r] = prev.split(",").map(Number);
    path.unshift({ q, r });
    cursor = prev;
  }
  return path;
}

function movementCost(tile: HexTile, owner: OwnerSide): number {
  if (!tile.passable) return Number.POSITIVE_INFINITY;
  let cost = tile.movementCost;
  if (tile.features.includes("secret_path") && owner === "monster") cost *= 0.85;
  if (tile.features.includes("wall") && tile.owner && tile.owner !== owner) cost *= 1.35;
  if (tile.features.includes("moat") && tile.owner && tile.owner !== owner) cost *= 1.25;
  return Math.round(cost * 1000) / 1000;
}

export function reachableTiles(map: TowerMap, army: Army): Map<string, number> {
  const distances = new Map<string, number>([[key(army.position), 0]]);
  const queue = new Set<string>([key(army.position)]);

  while (queue.size) {
    let current = "";
    let best = Number.POSITIVE_INFINITY;
    for (const item of queue) {
      const distance = distances.get(item) ?? Number.POSITIVE_INFINITY;
      if (distance < best) {
        current = item;
        best = distance;
      }
    }
    if (!current) break;
    queue.delete(current);
    const [q, r] = current.split(",").map(Number);
    for (const neighbor of tileNeighbors(map, { q, r })) {
      const step = movementCost(neighbor, army.owner);
      if (!Number.isFinite(step)) continue;
      const candidate = Math.round((best + step) * 1000) / 1000;
      if (candidate > army.movementPoints) continue;
      const neighborKey = key(neighbor.coord);
      if (candidate < (distances.get(neighborKey) ?? Number.POSITIVE_INFINITY)) {
        distances.set(neighborKey, candidate);
        queue.add(neighborKey);
      }
    }
  }

  return distances;
}
