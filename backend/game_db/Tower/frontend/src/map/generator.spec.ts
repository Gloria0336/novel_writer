import { describe, expect, it } from "vitest";

import { generateTowerMap } from "./generator";

function connectedNodeCount(map: ReturnType<typeof generateTowerMap>): number {
  const seen = new Set<string>();
  const queue = [map.nodes[0].id];
  while (queue.length) {
    const current = queue.shift()!;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const edge of map.edges) {
      if (edge.a === current && !seen.has(edge.b)) queue.push(edge.b);
      if (edge.b === current && !seen.has(edge.a)) queue.push(edge.a);
    }
  }
  return seen.size;
}

describe("generateTowerMap", () => {
  it("generates the same map for the same seed", () => {
    const a = generateTowerMap({ seed: "demo-seed" });
    const b = generateTowerMap({ seed: "demo-seed" });
    expect(a).toEqual(b);
  });

  it("generates different layouts for different seeds", () => {
    const a = generateTowerMap({ seed: "demo-a" });
    const b = generateTowerMap({ seed: "demo-b" });
    expect(a.nodes.map((node) => `${node.id}:${node.grid.c},${node.grid.r}`).join("|")).not.toEqual(
      b.nodes.map((node) => `${node.id}:${node.grid.c},${node.grid.r}`).join("|")
    );
  });

  it("does not create self-loop edges", () => {
    const map = generateTowerMap({ seed: "loops" });
    expect(map.edges.every((edge) => edge.a !== edge.b)).toBe(true);
  });

  it("keeps the graph connected", () => {
    const map = generateTowerMap({ seed: "connected" });
    expect(connectedNodeCount(map)).toBe(map.nodes.length);
  });

  it("creates exactly one capital and one main nest", () => {
    const map = generateTowerMap({ seed: "victory-points" });
    expect(map.nodes.filter((node) => node.nodeType === "capital")).toHaveLength(1);
    expect(map.nodes.filter((node) => node.nodeType === "main_nest")).toHaveLength(1);
  });

  it("uses secret paths only for monster nest structures", () => {
    const map = generateTowerMap({ seed: "secrets" });
    const nodes = new Map(map.nodes.map((node) => [node.id, node]));
    const secretEdges = map.edges.filter((edge) => edge.pathType === "secret");
    expect(secretEdges.length).toBeGreaterThan(0);
    for (const edge of secretEdges) {
      const a = nodes.get(edge.a)!;
      const b = nodes.get(edge.b)!;
      expect([a.owner, b.owner]).toEqual(["monster", "monster"]);
      expect([a.nodeType, b.nodeType].sort()).toEqual(expect.arrayContaining(["tribe"]));
      expect([a.nodeType, b.nodeType].some((type) => type === "sub_nest" || type === "main_nest")).toBe(true);
    }
  });
});
