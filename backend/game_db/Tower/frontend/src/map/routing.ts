import type { RoutePlan, TowerMap, TowerMapEdge, TowerMapNode, ViewMode } from "../types";

function edgeVisible(edge: TowerMapEdge, viewMode: ViewMode): boolean {
  if (viewMode === "omniscient") return true;
  return edge.revealedTo.includes(viewMode);
}

export function neighborsFor(map: TowerMap, nodeId: string, viewMode: ViewMode): Array<{ node: TowerMapNode; edge: TowerMapEdge }> {
  const out: Array<{ node: TowerMapNode; edge: TowerMapEdge }> = [];
  for (const edge of map.edges) {
    if (!edgeVisible(edge, viewMode)) continue;
    if (edge.a === nodeId) {
      const node = map.nodes.find((entry) => entry.id === edge.b);
      if (node) out.push({ node, edge });
    } else if (edge.b === nodeId) {
      const node = map.nodes.find((entry) => entry.id === edge.a);
      if (node) out.push({ node, edge });
    }
  }
  return out;
}

export function findShortestRoute(map: TowerMap, startId: string, endId: string, viewMode: ViewMode): RoutePlan | null {
  if (!startId || !endId || startId === endId) return null;
  const distances = new Map<string, number>();
  const previous = new Map<string, { nodeId: string; edgeId: string }>();
  const queue = new Set(map.nodes.map((node) => node.id));

  for (const node of map.nodes) distances.set(node.id, node.id === startId ? 0 : Number.POSITIVE_INFINITY);

  while (queue.size) {
    let current = "";
    let best = Number.POSITIVE_INFINITY;
    for (const nodeId of queue) {
      const distance = distances.get(nodeId) ?? Number.POSITIVE_INFINITY;
      if (distance < best) {
        best = distance;
        current = nodeId;
      }
    }
    if (!current || best === Number.POSITIVE_INFINITY) break;
    queue.delete(current);
    if (current === endId) break;

    for (const { node, edge } of neighborsFor(map, current, viewMode)) {
      if (!queue.has(node.id)) continue;
      const candidate = best + edge.travelCost;
      if (candidate < (distances.get(node.id) ?? Number.POSITIVE_INFINITY)) {
        distances.set(node.id, candidate);
        previous.set(node.id, { nodeId: current, edgeId: edge.id });
      }
    }
  }

  if (!previous.has(endId)) return null;
  const nodeIds = [endId];
  const edgeIds: string[] = [];
  let cursor = endId;
  while (cursor !== startId) {
    const entry = previous.get(cursor);
    if (!entry) return null;
    edgeIds.unshift(entry.edgeId);
    nodeIds.unshift(entry.nodeId);
    cursor = entry.nodeId;
  }

  return {
    nodeIds,
    edgeIds,
    totalCost: Math.round((distances.get(endId) ?? 0) * 10) / 10
  };
}

export function edgeBetween(map: TowerMap, a: string, b: string): TowerMapEdge | undefined {
  return map.edges.find((edge) => (edge.a === a && edge.b === b) || (edge.a === b && edge.b === a));
}
