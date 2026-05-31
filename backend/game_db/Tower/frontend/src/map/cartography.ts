import type { ContourLine, MapGenConfig, Position, TerrainRegion, TerrainType, TowerMap } from "../types";
import { rngFromSeed, stableNoise } from "./rng";

const TERRAIN_ELEVATION_BIAS: Record<TerrainType, number> = {
  water: -0.34,
  swamp: -0.2,
  plain: -0.03,
  forest: 0.05,
  desert: 0.02,
  mountain: 0.36
};

const NEIGHBORS = [
  { dc: 1, dr: 0 },
  { dc: -1, dr: 0 },
  { dc: 0, dr: 1 },
  { dc: 0, dr: -1 }
];

type GridPoint = { x: number; y: number };
type BoundarySegment = { from: GridPoint; to: GridPoint };

function cellKey(c: number, r: number): string {
  return `${c},${r}`;
}

function pointKey(point: GridPoint | Position): string {
  return `${point.x.toFixed(3)},${point.y.toFixed(3)}`;
}

function tagsForTerrain(terrainType: TerrainType): string[] {
  return terrainType === "swamp" ? ["marsh", "swamp"] : [terrainType];
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function softenClosedLoop(points: Position[]): Position[] {
  if (points.length < 7) return points;
  const closed = pointKey(points[0]) === pointKey(points[points.length - 1]);
  const source = closed ? points.slice(0, -1) : points;
  const out: Position[] = [];
  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    const next = source[(index + 1) % source.length];
    out.push({
      x: current.x * 0.75 + next.x * 0.25,
      y: current.y * 0.75 + next.y * 0.25
    });
    out.push({
      x: current.x * 0.25 + next.x * 0.75,
      y: current.y * 0.25 + next.y * 0.75
    });
  }
  out.push(out[0]);
  return out;
}

function outlineLoopsForCells(cells: Array<{ c: number; r: number }>, cellSize: number): Position[][] {
  const occupied = new Set(cells.map((cell) => cellKey(cell.c, cell.r)));
  const segments: BoundarySegment[] = [];
  const addSegment = (from: GridPoint, to: GridPoint) => segments.push({ from, to });

  for (const cell of cells) {
    const { c, r } = cell;
    if (!occupied.has(cellKey(c, r - 1))) addSegment({ x: c, y: r }, { x: c + 1, y: r });
    if (!occupied.has(cellKey(c + 1, r))) addSegment({ x: c + 1, y: r }, { x: c + 1, y: r + 1 });
    if (!occupied.has(cellKey(c, r + 1))) addSegment({ x: c + 1, y: r + 1 }, { x: c, y: r + 1 });
    if (!occupied.has(cellKey(c - 1, r))) addSegment({ x: c, y: r + 1 }, { x: c, y: r });
  }

  const starts = new Map<string, number[]>();
  segments.forEach((segment, index) => {
    const key = pointKey(segment.from);
    starts.set(key, [...(starts.get(key) ?? []), index]);
  });

  const used = new Set<number>();
  const loops: Position[][] = [];
  for (let index = 0; index < segments.length; index += 1) {
    if (used.has(index)) continue;
    const first = segments[index];
    used.add(index);
    const loop: GridPoint[] = [first.from, first.to];
    const startKey = pointKey(first.from);
    let cursorKey = pointKey(first.to);
    let guard = 0;

    while (cursorKey !== startKey && guard < segments.length + 4) {
      guard += 1;
      const nextIndex = (starts.get(cursorKey) ?? []).find((candidate) => !used.has(candidate));
      if (nextIndex === undefined) break;
      used.add(nextIndex);
      const next = segments[nextIndex];
      loop.push(next.to);
      cursorKey = pointKey(next.to);
    }

    if (loop.length >= 4) {
      loops.push(
        softenClosedLoop(
          loop.map((point) => ({
            x: point.x * cellSize,
            y: point.y * cellSize
          }))
        )
      );
    }
  }

  return loops;
}

export function buildTerrainRegions(grid: TerrainType[][], cellSize: number): TerrainRegion[] {
  const regions: TerrainRegion[] = [];
  const visited = new Set<string>();
  const counters = new Map<TerrainType, number>();

  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r].length; c += 1) {
      const key = cellKey(c, r);
      if (visited.has(key)) continue;

      const terrainType = grid[r][c];
      const cells: Array<{ c: number; r: number }> = [];
      const queue = [{ c, r }];
      visited.add(key);
      let minC = c;
      let minR = r;
      let maxC = c;
      let maxR = r;

      while (queue.length) {
        const current = queue.shift()!;
        cells.push(current);
        minC = Math.min(minC, current.c);
        minR = Math.min(minR, current.r);
        maxC = Math.max(maxC, current.c);
        maxR = Math.max(maxR, current.r);

        for (const direction of NEIGHBORS) {
          const nextC = current.c + direction.dc;
          const nextR = current.r + direction.dr;
          if (nextR < 0 || nextR >= grid.length || nextC < 0 || nextC >= grid[nextR].length) continue;
          if (grid[nextR][nextC] !== terrainType) continue;
          const nextKey = cellKey(nextC, nextR);
          if (visited.has(nextKey)) continue;
          visited.add(nextKey);
          queue.push({ c: nextC, r: nextR });
        }
      }

      const count = (counters.get(terrainType) ?? 0) + 1;
      counters.set(terrainType, count);
      regions.push({
        id: `terrain-${terrainType}-${count}`,
        terrainType,
        bounds: [minC, minR, maxC, maxR],
        tags: tagsForTerrain(terrainType),
        cells,
        outlines: outlineLoopsForCells(cells, cellSize)
      });
    }
  }

  return regions;
}

export function buildElevationGrid(config: MapGenConfig, terrainGrid: TerrainType[][], seed: string): number[][] {
  const rng = rngFromSeed(`${seed}:elevation`);
  const broad = stableNoise(rng, 96);
  const folded = stableNoise(rng, 96);
  const detail = stableNoise(rng, 64);
  const raw: number[][] = [];
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (let r = 0; r < terrainGrid.length; r += 1) {
    const row: number[] = [];
    for (let c = 0; c < terrainGrid[r].length; c += 1) {
      const x = c / Math.max(1, config.width - 1);
      const y = r / Math.max(1, config.height - 1);
      const ridge = Math.abs(folded(c * 0.045 + 17, r * 0.045 - 11) - 0.5) * 2;
      const tilt = Math.sin((x * 1.35 + y * 0.72) * Math.PI) * 0.075;
      const value =
        broad(c * 0.055, r * 0.055) * 0.54 +
        detail(c * 0.17 + 41, r * 0.17 - 23) * 0.22 +
        ridge * 0.16 +
        tilt +
        TERRAIN_ELEVATION_BIAS[terrainGrid[r][c]];
      row.push(value);
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
    raw.push(row);
  }

  const range = max - min || 1;
  return raw.map((row) => row.map((value) => round3((value - min) / range)));
}

function contourIntersection(level: number, a: number, b: number, from: GridPoint, to: GridPoint): GridPoint | null {
  if (a === b) return null;
  const crosses = (a < level && b >= level) || (b < level && a >= level);
  if (!crosses) return null;
  const t = (level - a) / (b - a);
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t
  };
}

function chainSegments(segments: Array<[Position, Position]>): Position[][] {
  const starts = new Map<string, number[]>();
  segments.forEach(([start], index) => {
    const key = pointKey(start);
    starts.set(key, [...(starts.get(key) ?? []), index]);
  });
  const ends = new Map<string, number[]>();
  segments.forEach(([, end], index) => {
    const key = pointKey(end);
    ends.set(key, [...(ends.get(key) ?? []), index]);
  });

  const used = new Set<number>();
  const polylines: Position[][] = [];
  for (let index = 0; index < segments.length; index += 1) {
    if (used.has(index)) continue;
    used.add(index);
    const polyline = [segments[index][0], segments[index][1]];

    let extended = true;
    while (extended) {
      extended = false;
      const tailKey = pointKey(polyline[polyline.length - 1]);
      const nextAtTail = (starts.get(tailKey) ?? []).find((candidate) => !used.has(candidate));
      if (nextAtTail !== undefined) {
        used.add(nextAtTail);
        polyline.push(segments[nextAtTail][1]);
        extended = true;
        continue;
      }
      const reversedAtTail = (ends.get(tailKey) ?? []).find((candidate) => !used.has(candidate));
      if (reversedAtTail !== undefined) {
        used.add(reversedAtTail);
        polyline.push(segments[reversedAtTail][0]);
        extended = true;
      }
    }

    extended = true;
    while (extended) {
      extended = false;
      const headKey = pointKey(polyline[0]);
      const previousAtHead = (ends.get(headKey) ?? []).find((candidate) => !used.has(candidate));
      if (previousAtHead !== undefined) {
        used.add(previousAtHead);
        polyline.unshift(segments[previousAtHead][0]);
        extended = true;
        continue;
      }
      const reversedAtHead = (starts.get(headKey) ?? []).find((candidate) => !used.has(candidate));
      if (reversedAtHead !== undefined) {
        used.add(reversedAtHead);
        polyline.unshift(segments[reversedAtHead][1]);
        extended = true;
      }
    }

    if (polyline.length >= 2) polylines.push(polyline);
  }

  return polylines;
}

export function buildContourLines(elevationGrid: number[][], config: MapGenConfig): ContourLine[] {
  const lines: ContourLine[] = [];
  const cellSize = config.cellSize;
  const levels = Array.from({ length: 14 }, (_, index) => round3(0.12 + index * 0.055));

  levels.forEach((level, levelIndex) => {
    const segments: Array<[Position, Position]> = [];
    for (let r = 0; r < elevationGrid.length - 1; r += 1) {
      for (let c = 0; c < elevationGrid[r].length - 1; c += 1) {
        const tl = elevationGrid[r][c];
        const tr = elevationGrid[r][c + 1];
        const br = elevationGrid[r + 1][c + 1];
        const bl = elevationGrid[r + 1][c];
        const points = [
          contourIntersection(level, tl, tr, { x: c, y: r }, { x: c + 1, y: r }),
          contourIntersection(level, tr, br, { x: c + 1, y: r }, { x: c + 1, y: r + 1 }),
          contourIntersection(level, bl, br, { x: c, y: r + 1 }, { x: c + 1, y: r + 1 }),
          contourIntersection(level, tl, bl, { x: c, y: r }, { x: c, y: r + 1 })
        ].filter((point): point is GridPoint => point !== null);

        if (points.length === 2) {
          segments.push(points.map((point) => ({
            x: point.x * cellSize + cellSize / 2,
            y: point.y * cellSize + cellSize / 2
          })) as [Position, Position]);
        } else if (points.length === 4) {
          segments.push(
            [
              { x: points[0].x * cellSize + cellSize / 2, y: points[0].y * cellSize + cellSize / 2 },
              { x: points[1].x * cellSize + cellSize / 2, y: points[1].y * cellSize + cellSize / 2 }
            ],
            [
              { x: points[2].x * cellSize + cellSize / 2, y: points[2].y * cellSize + cellSize / 2 },
              { x: points[3].x * cellSize + cellSize / 2, y: points[3].y * cellSize + cellSize / 2 }
            ]
          );
        }
      }
    }

    for (const points of chainSegments(segments)) {
      if (points.length >= 3) {
        lines.push({
          level,
          kind: levelIndex % 3 === 0 ? "major" : "minor",
          points
        });
      }
    }
  });

  return lines;
}

export function hydrateMapCartography(map: TowerMap): TowerMap {
  const terrainRegions = Array.isArray(map.terrainRegions) ? map.terrainRegions : [];
  const hasRichRegions = terrainRegions.every((region) => Array.isArray(region.cells) && Array.isArray(region.outlines));
  const elevationGrid = Array.isArray(map.elevationGrid)
    ? map.elevationGrid
    : buildElevationGrid(map.config, map.terrainGrid, map.seed);
  return {
    ...map,
    terrainRegions: hasRichRegions && terrainRegions.length ? terrainRegions : buildTerrainRegions(map.terrainGrid, map.config.cellSize),
    elevationGrid,
    contourLines: Array.isArray(map.contourLines) ? map.contourLines : buildContourLines(elevationGrid, map.config)
  };
}
