import type {
  DensityPreset,
  GarrisonSummary,
  GenerationPreset,
  MapGenConfig,
  NodeBonus,
  NodeType,
  OwnerSide,
  PathType,
  Position,
  TerrainType,
  TowerMap,
  TowerMapEdge,
  TowerMapNode
} from "../types";
import { buildContourLines, buildElevationGrid, buildTerrainRegions } from "./cartography";
import {
  DEFAULT_SEED,
  DENSITY_VALUES,
  PATH_COST,
  PRESET_DIMENSIONS,
  TERRAIN_COST
} from "./constants";
import { randomInt, randomRange, rngFromSeed, stableNoise, type RandomSource, weightedPick } from "./rng";

type Zone = "human" | "monster" | "contested";

type PlacementOptions = {
  cx?: number;
  cy?: number;
  spread?: number;
  zone?: Zone;
  minDistance?: number;
  index?: number;
};

const TERRAIN_WEIGHTS: Array<[TerrainType, number]> = [
  ["plain", 30],
  ["forest", 20],
  ["mountain", 17],
  ["swamp", 13],
  ["water", 12],
  ["desert", 8]
];

const NODE_COUNTER_KEYS: NodeType[] = ["capital", "city", "main_nest", "sub_nest", "tribe", "neutral"];

export const DEFAULT_CONFIG: MapGenConfig = {
  seed: DEFAULT_SEED,
  width: PRESET_DIMENSIONS.standard.width,
  height: PRESET_DIMENSIONS.standard.height,
  cellSize: 12,
  humanCities: DENSITY_VALUES.standard.humanCities,
  neutralNodes: DENSITY_VALUES.standard.neutralNodes,
  extraEdgeRatio: DENSITY_VALUES.standard.extraEdgeRatio,
  preset: "standard",
  density: "standard"
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, digits = 1): number {
  const pow = 10 ** digits;
  return Math.round(value * pow) / pow;
}

export function configForPresets(seed: string, preset: GenerationPreset, density: DensityPreset): MapGenConfig {
  const dimensions = PRESET_DIMENSIONS[preset];
  const densityValues = DENSITY_VALUES[density];
  return {
    ...DEFAULT_CONFIG,
    ...dimensions,
    ...densityValues,
    seed,
    preset,
    density
  };
}

export function normalizeConfig(input: Partial<MapGenConfig> = {}): MapGenConfig {
  const seed = input.seed?.trim() || DEFAULT_CONFIG.seed;
  const preset = input.preset ?? DEFAULT_CONFIG.preset;
  const density = input.density ?? DEFAULT_CONFIG.density;
  return {
    ...configForPresets(seed, preset, density),
    ...input,
    seed,
    preset,
    density
  };
}

function distanceCells(a: TowerMapNode, b: TowerMapNode): number {
  return Math.hypot(a.grid.c - b.grid.c, a.grid.r - b.grid.r);
}

function nameForNode(type: NodeType, terrain: TerrainType, index: number): string {
  if (type === "capital") return "星冠王城";
  if (type === "main_nest") return "黑喉主巢";
  if (type === "city") {
    const names: Record<TerrainType, string> = {
      plain: "白麥城",
      forest: "松影城",
      swamp: "灰沼城",
      desert: "赤砂城",
      mountain: "鐵脊城",
      water: "臨水城"
    };
    return `${names[terrain]} ${index}`;
  }
  if (type === "sub_nest") return `裂牙副巢 ${index}`;
  if (type === "tribe") return `血角部落 ${index}`;
  const neutralNames: Record<TerrainType, string> = {
    plain: "草原驛站",
    forest: "林間哨所",
    swamp: "泥炭渡口",
    desert: "鹽風綠洲",
    mountain: "寒鐵隘口",
    water: "河灣橋頭"
  };
  return `${neutralNames[terrain]} ${index}`;
}

function baseTags(terrain: TerrainType, nearWater: boolean): string[] {
  const tags = terrain === "swamp" ? ["marsh"] : [terrain];
  if (nearWater) tags.push("water_access");
  return [...new Set(tags)];
}

function buildGarrison(type: NodeType, owner: OwnerSide, rng: RandomSource): GarrisonSummary {
  const ranges: Record<NodeType, [number, number]> = {
    capital: [860, 1220],
    city: [280, 520],
    main_nest: [540, 840],
    sub_nest: [160, 320],
    tribe: [70, 150],
    neutral: [0, 90]
  };
  const [min, max] = ranges[type];
  const strength = randomInt(rng, min, max);
  if (strength === 0) return { strength, stacks: [] };

  if (owner === "human") {
    return {
      strength,
      stacks: [
        {
          templateId: type === "capital" ? "royal_guard" : "city_guard",
          name: type === "capital" ? "王城精兵" : "城防精兵",
          count: Math.max(1, Math.round(strength / 18)),
          power: strength
        }
      ]
    };
  }

  if (owner === "monster") {
    return {
      strength,
      stacks: [
        {
          templateId: type === "main_nest" ? "orc_brood" : "goblin_horde",
          name: type === "main_nest" ? "半獸人孵群" : "哥布林群",
          count: Math.max(1, Math.round(strength / 7)),
          power: strength
        }
      ]
    };
  }

  return {
    strength,
    stacks: [
      {
        templateId: "local_militia",
        name: "地方守備",
        count: Math.max(1, Math.round(strength / 12)),
        power: strength
      }
    ]
  };
}

function nodeBonuses(node: TowerMapNode): NodeBonus[] {
  const bonuses: NodeBonus[] = [];
  const add = (bonus: NodeBonus) => bonuses.push(bonus);

  if (node.nodeType === "capital") {
    add({ type: "resource_yield", magnitude: 8, resource: "combat_resource", description: "王城產出戰鬥資源", source: "capital" });
    add({ type: "research_rate", magnitude: 0.3, description: "王城學院加速研究", source: "capital" });
    add({ type: "terrain_defense", magnitude: 1.4, description: "王城天險", source: "capital" });
  }
  if (node.nodeType === "city") {
    add({ type: "resource_yield", magnitude: 4, resource: "combat_resource", description: "城市產出", source: "city" });
    add({ type: "recruit_rate", magnitude: 0.2, description: "城市兵營", source: "city" });
  }
  if (node.nodeType === "main_nest") {
    add({ type: "resource_yield", magnitude: 6, resource: "monster_source", description: "主巢魔物源", source: "main_nest" });
    add({ type: "recruit_rate", magnitude: 0.3, description: "主巢孵化池", source: "main_nest" });
  }
  if (node.nodeType === "sub_nest") {
    add({ type: "resource_yield", magnitude: 3, resource: "monster_source", description: "副巢魔物源", source: "sub_nest" });
    add({ type: "recruit_rate", magnitude: 0.15, description: "副巢孵化", source: "sub_nest" });
  }
  if (node.nodeType === "tribe") {
    add({ type: "recruit_rate", magnitude: 0.1, description: "部落補員", source: "tribe" });
  }
  if (node.terrainType === "mountain") {
    add({ type: "terrain_defense", magnitude: 1.5, description: "山地易守", source: "mountain" });
    add({ type: "vision", magnitude: 0.25, description: "高地視野", source: "mountain" });
  }
  if (node.terrainType === "swamp") {
    add({ type: "terrain_defense", magnitude: 1.3, description: "沼澤遲滯", source: "marsh" });
    add({ type: "movement", magnitude: -0.25, description: "沼澤拖慢行軍", source: "marsh" });
  }
  if (node.tags.includes("water_access")) {
    add({ type: "movement", magnitude: 0.15, description: "渡口與橋頭堡", source: "water_access" });
  }
  if (node.tags.includes("crossroads")) {
    add({ type: "movement", magnitude: 0.3, description: "道路樞紐", source: "crossroads" });
  }

  return bonuses;
}

export function generateTowerMap(input: Partial<MapGenConfig> = {}): TowerMap {
  const config = normalizeConfig(input);
  const rng = rngFromSeed(config.seed);
  const warpX = stableNoise(rng);
  const warpY = stableNoise(rng);
  const terrainSeedCount = Math.max(24, Math.round((config.width * config.height) / 105));
  const terrainSeeds = Array.from({ length: terrainSeedCount }, () => ({
    c: rng() * config.width,
    r: rng() * config.height,
    terrain: weightedPick(rng, TERRAIN_WEIGHTS)
  }));

  const terrainGrid: TerrainType[][] = [];
  for (let r = 0; r < config.height; r += 1) {
    const row: TerrainType[] = [];
    for (let c = 0; c < config.width; c += 1) {
      const warpedC = c + (warpX(c * 0.11, r * 0.11) - 0.5) * 9;
      const warpedR = r + (warpY(c * 0.11, r * 0.11) - 0.5) * 9;
      let best = terrainSeeds[0];
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const seed of terrainSeeds) {
        const distance = (warpedC - seed.c) ** 2 + (warpedR - seed.r) ** 2;
        if (distance < bestDistance) {
          best = seed;
          bestDistance = distance;
        }
      }
      row.push(best.terrain);
    }
    terrainGrid.push(row);
  }
  const terrainRegions = buildTerrainRegions(terrainGrid, config.cellSize);
  const terrainRegionIdByCell = new Map<string, string>();
  for (const region of terrainRegions) {
    for (const cell of region.cells) terrainRegionIdByCell.set(`${cell.c},${cell.r}`, region.id);
  }
  const elevationGrid = buildElevationGrid(config, terrainGrid, config.seed);
  const contourLines = buildContourLines(elevationGrid, config);

  const nodes: TowerMapNode[] = [];
  const edges: TowerMapEdge[] = [];
  const counters = Object.fromEntries(NODE_COUNTER_KEYS.map((key) => [key, 0])) as Record<NodeType, number>;
  const phase = rng() * Math.PI * 2;
  const contestWidth = config.width * 0.13;
  const factionLineAt = (r: number) => config.width * 0.5 + Math.sin((r / config.height) * Math.PI * 1.3 + phase) * config.width * 0.075;
  const zoneOf = (c: number, r: number): Zone => {
    const line = factionLineAt(r);
    if (c < line - contestWidth) return "human";
    if (c > line + contestWidth) return "monster";
    return "contested";
  };
  const nearWater = (c: number, r: number) => {
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr >= 0 && rr < config.height && cc >= 0 && cc < config.width && terrainGrid[rr][cc] === "water") {
          return true;
        }
      }
    }
    return false;
  };
  const tooClose = (c: number, r: number, minDistance: number) =>
    nodes.some((node) => Math.hypot(node.grid.c - c, node.grid.r - r) < minDistance);
  const makeNode = (type: NodeType, owner: OwnerSide, c: number, r: number, index: number, parentNestId: string | null): TowerMapNode => {
    counters[type] += 1;
    const terrainType = terrainGrid[r][c];
    const tags = baseTags(terrainType, nearWater(c, r));
    const fortRanges: Record<NodeType, [number, number]> = {
      capital: [2, 3],
      city: [1.4, 1.8],
      main_nest: [1.3, 1.6],
      sub_nest: [1.1, 1.3],
      tribe: [1, 1.1],
      neutral: [1, 1.4]
    };
    const [fortMin, fortMax] = fortRanges[type];
    const terrainFort = terrainType === "mountain" || terrainType === "swamp" ? 1.15 : 1;
    const node: TowerMapNode = {
      id: `${type}-${counters[type]}`,
      name: nameForNode(type, terrainType, index || counters[type]),
      nodeType: type,
      owner,
      position: { x: c * config.cellSize + config.cellSize / 2, y: r * config.cellSize + config.cellSize / 2 },
      grid: { c, r },
      terrainId: terrainRegionIdByCell.get(`${c},${r}`) ?? `terrain-${terrainType}`,
      terrainType,
      fortification: round(randomRange(rng, fortMin, fortMax) * terrainFort, 2),
      garrisonSummary: buildGarrison(type, owner, rng),
      bonuses: [],
      parentNestId,
      tags
    };
    nodes.push(node);
    return node;
  };
  const place = (type: NodeType, owner: OwnerSide, options: PlacementOptions): TowerMapNode => {
    const minDistance = options.minDistance ?? 4;
    for (let attempt = 0; attempt < 520; attempt += 1) {
      const rawC = options.cx === undefined ? rng() * config.width : (options.cx + (rng() - 0.5) * (options.spread ?? 0.18)) * config.width;
      const rawR = options.cy === undefined ? rng() * config.height : (options.cy + (rng() - 0.5) * (options.spread ?? 0.18)) * config.height;
      const c = clamp(Math.round(rawC), 1, config.width - 2);
      const r = clamp(Math.round(rawR), 1, config.height - 2);
      if (options.zone && zoneOf(c, r) !== options.zone) continue;
      if (terrainGrid[r][c] === "water") continue;
      if (tooClose(c, r, minDistance)) continue;
      return makeNode(type, owner, c, r, options.index ?? 0, null);
    }

    for (let r = 1; r < config.height - 1; r += 1) {
      for (let c = 1; c < config.width - 1; c += 1) {
        if (options.zone && zoneOf(c, r) !== options.zone) continue;
        if (terrainGrid[r][c] === "water") continue;
        if (tooClose(c, r, Math.max(1, minDistance / 2))) continue;
        return makeNode(type, owner, c, r, options.index ?? 0, null);
      }
    }
    throw new Error(`無法放置據點: ${type}`);
  };
  const cluster = (center: TowerMapNode, type: NodeType, count: number, radius: number, minDistance: number) => {
    for (let index = 1; index <= count; index += 1) {
      for (let attempt = 0; attempt < 220; attempt += 1) {
        const angle = rng() * Math.PI * 2;
        const length = randomRange(rng, radius * 0.35, radius);
        const c = clamp(Math.round(center.grid.c + Math.cos(angle) * length), 1, config.width - 2);
        const r = clamp(Math.round(center.grid.r + Math.sin(angle) * length), 1, config.height - 2);
        if (zoneOf(c, r) === "human") continue;
        if (terrainGrid[r][c] === "water") continue;
        if (tooClose(c, r, minDistance)) continue;
        makeNode(type, "monster", c, r, index, center.id);
        break;
      }
    }
  };

  const capital = place("capital", "human", { cx: 0.14, cy: 0.5, spread: 0.22, zone: "human", minDistance: 0 });
  const mainNest = place("main_nest", "monster", { cx: 0.86, cy: 0.5, spread: 0.22, zone: "monster", minDistance: 0 });
  for (let index = 1; index <= config.humanCities; index += 1) {
    place("city", "human", { cx: randomRange(rng, 0.22, 0.42), cy: rng(), spread: 0.32, zone: "human", minDistance: 5, index });
  }
  cluster(mainNest, "sub_nest", randomInt(rng, 1, 3), config.width * 0.15, 4.2);
  cluster(mainNest, "tribe", randomInt(rng, 2, 4), config.width * 0.22, 3.4);
  for (let index = 1; index <= config.neutralNodes; index += 1) {
    place("neutral", "neutral", { cx: 0.5, cy: rng(), spread: 0.58, minDistance: 4.2, index });
  }

  const nodeById = (id: string) => {
    const node = nodes.find((entry) => entry.id === id);
    if (!node) throw new Error(`找不到節點: ${id}`);
    return node;
  };
  const hasEdge = (a: string, b: string) => edges.some((edge) => (edge.a === a && edge.b === b) || (edge.a === b && edge.b === a));
  const terrainAtPixel = (point: Position) => {
    const c = clamp(Math.round((point.x - config.cellSize / 2) / config.cellSize), 0, config.width - 1);
    const r = clamp(Math.round((point.y - config.cellSize / 2) / config.cellSize), 0, config.height - 1);
    return terrainGrid[r][c];
  };
  const makeTrailPolyline = (a: TowerMapNode, b: TowerMapNode, salt: number): Position[] => {
    const points: Position[] = [a.position];
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const length = Math.hypot(dx, dy) || 1;
    const px = -dy / length;
    const py = dx / length;
    for (const t of [0.28, 0.55, 0.78]) {
      const wave = Math.sin(salt + t * Math.PI * 2) * config.cellSize * 1.5;
      points.push({ x: a.position.x + dx * t + px * wave, y: a.position.y + dy * t + py * wave });
    }
    points.push(b.position);
    return points;
  };
  const computePolylineLength = (polyline: Position[]) =>
    polyline.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - polyline[index].x, point.y - polyline[index].y) / config.cellSize, 0);
  const makeEdge = (aId: string, bId: string, pathType: PathType): TowerMapEdge => {
    const a = nodeById(aId);
    const b = nodeById(bId);
    const polyline = pathType === "trail" ? makeTrailPolyline(a, b, edges.length + rng() * 50) : undefined;
    const length = polyline ? computePolylineLength(polyline) : distanceCells(a, b);
    const terrainCounts: Partial<Record<TerrainType, number>> = {};
    const samples = Math.max(8, Math.ceil(length * 3));
    for (let index = 0; index <= samples; index += 1) {
      const t = index / samples;
      let point: Position;
      if (polyline) {
        const segmentIndex = clamp(Math.floor(t * (polyline.length - 1)), 0, polyline.length - 2);
        const localT = t * (polyline.length - 1) - segmentIndex;
        const from = polyline[segmentIndex];
        const to = polyline[segmentIndex + 1];
        point = { x: from.x + (to.x - from.x) * localT, y: from.y + (to.y - from.y) * localT };
      } else {
        point = { x: a.position.x + (b.position.x - a.position.x) * t, y: a.position.y + (b.position.y - a.position.y) * t };
      }
      const terrain = terrainAtPixel(point);
      terrainCounts[terrain] = (terrainCounts[terrain] ?? 0) + 1;
    }
    const terrainMix = Object.fromEntries(
      Object.entries(terrainCounts).map(([terrain, count]) => [terrain, round((count ?? 0) / (samples + 1), 3)])
    ) as Partial<Record<TerrainType, number>>;
    const dominantTerrain = Object.entries(terrainCounts).sort((left, right) => (right[1] ?? 0) - (left[1] ?? 0))[0][0] as TerrainType;
    const speed = pathType === "secret" ? 1.45 : pathType === "road" ? 1.18 : 1;
    const travelCost = round((length * TERRAIN_COST[dominantTerrain] * PATH_COST[pathType]) / speed, 1);
    return {
      id: `edge-${edges.length + 1}`,
      a: aId,
      b: bId,
      pathType,
      length: round(length, 1),
      terrainMix,
      dominantTerrain,
      travelCost,
      revealedTo: pathType === "secret" ? ["monster"] : ["human", "monster", "neutral"],
      ...(polyline ? { polyline } : {})
    };
  };
  const mst = (subset: TowerMapNode[]) => {
    if (subset.length < 2) return;
    const tree = new Set<string>([subset[0].id]);
    const remaining = subset.slice(1);
    while (remaining.length) {
      let bestIndex = 0;
      let bestA = [...tree][0];
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let index = 0; index < remaining.length; index += 1) {
        for (const treeId of tree) {
          const distance = distanceCells(remaining[index], nodeById(treeId));
          if (distance < bestDistance) {
            bestDistance = distance;
            bestIndex = index;
            bestA = treeId;
          }
        }
      }
      const bestB = remaining[bestIndex].id;
      edges.push(makeEdge(bestA, bestB, "road"));
      tree.add(bestB);
      remaining.splice(bestIndex, 1);
    }
  };
  mst(nodes.filter((node) => node.nodeType === "capital" || node.nodeType === "city"));
  mst(nodes.filter((node) => node.nodeType === "main_nest" || node.nodeType === "sub_nest"));

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const distance = distanceCells(a, b);
      if (distance > config.width * 0.31 || hasEdge(a.id, b.id)) continue;
      let probability = config.extraEdgeRatio * (1 - distance / (config.width * 0.31)) * 1.35;
      if (a.owner === "monster" && b.owner === "monster") probability *= 1.8;
      if (a.owner === "neutral" || b.owner === "neutral") probability *= 1.2;
      if (rng() < probability) edges.push(makeEdge(a.id, b.id, "trail"));
    }
  }

  const parent = nodes.map((_, index) => index);
  const find = (value: number): number => {
    while (parent[value] !== value) {
      parent[value] = parent[parent[value]];
      value = parent[value];
    }
    return value;
  };
  const union = (a: number, b: number) => {
    parent[find(a)] = find(b);
  };
  edges.forEach((edge) => union(nodes.findIndex((node) => node.id === edge.a), nodes.findIndex((node) => node.id === edge.b)));
  for (let guard = 0; guard < 40; guard += 1) {
    const groups = new Map<number, TowerMapNode[]>();
    for (let index = 0; index < nodes.length; index += 1) {
      const root = find(index);
      groups.set(root, [...(groups.get(root) ?? []), nodes[index]]);
    }
    if (groups.size <= 1) break;
    const [first, ...rest] = [...groups.values()];
    let bestPair: [TowerMapNode, TowerMapNode] = [first[0], rest[0][0]];
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const a of first) {
      for (const group of rest) {
        for (const b of group) {
          const distance = distanceCells(a, b);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestPair = [a, b];
          }
        }
      }
    }
    edges.push(makeEdge(bestPair[0].id, bestPair[1].id, "trail"));
    union(nodes.findIndex((node) => node.id === bestPair[0].id), nodes.findIndex((node) => node.id === bestPair[1].id));
  }

  for (const tribe of nodes.filter((node) => node.nodeType === "tribe")) {
    const candidates = nodes
      .filter((node) => node.nodeType === "sub_nest" || node.nodeType === "main_nest")
      .sort((left, right) => distanceCells(tribe, left) - distanceCells(tribe, right));
    const target = candidates.find((candidate) => !hasEdge(tribe.id, candidate.id));
    if (target) edges.push(makeEdge(tribe.id, target.id, "secret"));
  }

  for (const node of nodes) {
    const roadDegree = edges.filter((edge) => edge.pathType === "road" && (edge.a === node.id || edge.b === node.id)).length;
    if (roadDegree >= 2) node.tags = [...new Set([...node.tags, "crossroads"])];
    node.bonuses = nodeBonuses(node);
  }

  return {
    schemaVersion: 1,
    generatedAt: "1970-01-01T00:00:00.000Z",
    seed: config.seed,
    pixelWidth: config.width * config.cellSize,
    pixelHeight: config.height * config.cellSize,
    config,
    terrainGrid,
    terrainRegions,
    elevationGrid,
    contourLines,
    nodes,
    edges,
    counts: {
      humanNodes: nodes.filter((node) => node.owner === "human").length,
      monsterNodes: nodes.filter((node) => node.owner === "monster").length,
      neutralNodes: nodes.filter((node) => node.owner === "neutral").length,
      roads: edges.filter((edge) => edge.pathType === "road").length,
      trails: edges.filter((edge) => edge.pathType === "trail").length,
      secrets: edges.filter((edge) => edge.pathType === "secret").length
    }
  };
}
