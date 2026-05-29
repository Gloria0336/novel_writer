import type { RaceGroup, Side, TechCatalog, TechCategory, TechNode } from "./types";

export type PositionedTech = {
  tech: TechNode;
  depth: number;
  x: number;
  y: number;
};

export type LayoutEdge = {
  from: string;
  to: string;
};

export type TechLayout = {
  nodes: PositionedTech[];
  edges: LayoutEdge[];
  width: number;
  height: number;
};

export const NODE_WIDTH = 168;
export const NODE_HEIGHT = 78;
const COLUMN_GAP = 96;
const ROW_GAP = 28;
const PADDING = 32;

const COLUMN_STRIDE = NODE_WIDTH + COLUMN_GAP;
const ROW_STRIDE = NODE_HEIGHT + ROW_GAP;

function computeDepths(nodes: TechNode[]): Map<string, number> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const depths = new Map<string, number>();

  const resolve = (id: string, seen: Set<string>): number => {
    const cached = depths.get(id);
    if (cached !== undefined) return cached;
    const node = byId.get(id);
    if (!node || node.prerequisites.length === 0) {
      depths.set(id, 0);
      return 0;
    }
    if (seen.has(id)) return 0;
    seen.add(id);
    let best = 0;
    for (const prereq of node.prerequisites) {
      if (!byId.has(prereq)) continue;
      best = Math.max(best, resolve(prereq, seen) + 1);
    }
    seen.delete(id);
    depths.set(id, best);
    return best;
  };

  for (const node of nodes) resolve(node.id, new Set());
  return depths;
}

export type LayoutFilter = {
  category?: TechCategory;
  raceGroup?: RaceGroup;
};

// 由左至右橫向 DAG 排版。opts 可進一步篩選 category 或 race_group。
export function layoutTechTree(catalog: TechCatalog, side: Side, opts?: LayoutFilter): TechLayout {
  let nodes = Object.values(catalog).filter((node) => node.side === side);
  if (opts?.category) nodes = nodes.filter((n) => n.category === opts.category);
  if (opts?.raceGroup) nodes = nodes.filter((n) => n.race_group === opts.raceGroup);

  const nodeSet = new Set(nodes.map((n) => n.id));

  // 深度計算只考慮當前可見節點內部的前置關係，跨群組前置不計入深度。
  const visibleNodes = nodes.map((n) => ({
    ...n,
    prerequisites: n.prerequisites.filter((p) => nodeSet.has(p))
  }));
  const depths = computeDepths(visibleNodes);

  const columns = new Map<number, TechNode[]>();
  for (const node of nodes) {
    const depth = depths.get(node.id) ?? 0;
    const bucket = columns.get(depth) ?? [];
    bucket.push(node);
    columns.set(depth, bucket);
  }

  let maxRows = 0;
  for (const bucket of columns.values()) {
    bucket.sort((a, b) =>
      a.category === b.category ? a.id.localeCompare(b.id) : a.category.localeCompare(b.category)
    );
    maxRows = Math.max(maxRows, bucket.length);
  }

  const maxDepth = Math.max(0, ...[...columns.keys()]);
  const positioned: PositionedTech[] = [];

  for (const [depth, bucket] of columns) {
    const columnHeight = bucket.length * ROW_STRIDE - ROW_GAP;
    const totalHeight = maxRows * ROW_STRIDE - ROW_GAP;
    const offsetY = (totalHeight - columnHeight) / 2;
    bucket.forEach((tech, index) => {
      positioned.push({
        tech,
        depth,
        x: PADDING + depth * COLUMN_STRIDE,
        y: PADDING + offsetY + index * ROW_STRIDE
      });
    });
  }

  const edges: LayoutEdge[] = [];
  for (const node of nodes) {
    for (const prereq of node.prerequisites) {
      // 只畫在當前視圖內可見的邊
      if (nodeSet.has(prereq)) edges.push({ from: prereq, to: node.id });
    }
  }

  const width = PADDING * 2 + (maxDepth + 1) * COLUMN_STRIDE - COLUMN_GAP;
  const height = PADDING * 2 + Math.max(1, maxRows) * ROW_STRIDE - ROW_GAP;

  return { nodes: positioned, edges, width, height };
}

export function ancestorChain(catalog: TechCatalog, techId: string): Set<string> {
  const chain = new Set<string>();
  const visit = (id: string) => {
    if (chain.has(id)) return;
    chain.add(id);
    const node = catalog[id];
    if (!node) return;
    for (const prereq of node.prerequisites) visit(prereq);
  };
  visit(techId);
  return chain;
}
