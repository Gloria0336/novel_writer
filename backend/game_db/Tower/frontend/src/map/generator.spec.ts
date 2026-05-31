import { describe, expect, it } from "vitest";

import { configForPresets, generateTowerMap } from "./generator";
import { findTileRoute, reachableTiles } from "./routing";

describe("generateTowerMap", () => {
  it("generates the same hex map for the same seed", () => {
    const a = generateTowerMap({ seed: "demo-seed" });
    const b = generateTowerMap({ seed: "demo-seed" });
    expect(a).toEqual(b);
  });

  it("generates different structure layouts for different seeds", () => {
    const a = generateTowerMap({ seed: "demo-a" });
    const b = generateTowerMap({ seed: "demo-b" });
    expect(a.structures.map((item) => `${item.id}:${item.footprint[0].q},${item.footprint[0].r}`).join("|")).not.toEqual(
      b.structures.map((item) => `${item.id}:${item.footprint[0].q},${item.footprint[0].r}`).join("|")
    );
  });

  it("creates one capital, one main nest, and configured cities", () => {
    const map = generateTowerMap({ seed: "victory-points", humanCities: 4 });
    expect(map.structures.filter((item) => item.structureType === "capital")).toHaveLength(1);
    expect(map.structures.filter((item) => item.structureType === "main_nest")).toHaveLength(1);
    expect(map.structures.filter((item) => item.structureType === "city")).toHaveLength(4);
  });

  it("creates a complete bounded tile map", () => {
    const map = generateTowerMap({ seed: "tiles", width: 24, height: 16 });
    expect(map.tileMap.tiles).toHaveLength(24 * 16);
    expect(map.tileMap.tiles.every((tile) => tile.coord.q >= 0 && tile.coord.q < 24 && tile.coord.r >= 0 && tile.coord.r < 16)).toBe(true);
  });

  it("marks roads, bridges or secret paths as tile features", () => {
    const map = generateTowerMap({ seed: "features" });
    expect(map.counts.roads).toBeGreaterThan(0);
    expect(map.counts.secrets).toBeGreaterThan(0);
    expect(map.tileMap.tiles.some((tile) => tile.features.includes("road") || tile.features.includes("bridge"))).toBe(true);
  });

  it("keeps structures on passable footprint tiles", () => {
    const map = generateTowerMap({ seed: "passable" });
    for (const structure of map.structures) {
      const tile = map.tileMap.tiles.find((item) => item.coord.q === structure.footprint[0].q && item.coord.r === structure.footprint[0].r);
      expect(tile?.passable).toBe(true);
    }
  });

  it("keeps preset dimensions stable", () => {
    expect(configForPresets("sizes", "compact", "standard")).toMatchObject({ width: 30, height: 20, humanCities: 3, neutralSites: 4 });
    expect(configForPresets("sizes", "standard", "low")).toMatchObject({ width: 36, height: 24, humanCities: 2, neutralSites: 3 });
    expect(configForPresets("sizes", "wide", "high")).toMatchObject({ width: 46, height: 24, humanCities: 5, neutralSites: 7 });
  });

  it("can route over passable hexes between same-side structures", () => {
    const map = generateTowerMap({ seed: "route" });
    const capital = map.structures.find((item) => item.structureType === "capital")!;
    const city = map.structures.find((item) => item.structureType === "city")!;
    expect(findTileRoute(map, capital.footprint[0], city.footprint[0])).toBeTruthy();
  });

  it("creates movable armies with reachable hexes", () => {
    const map = generateTowerMap({ seed: "m2-armies" });
    expect(map.armies).toHaveLength(4);
    expect(map.counts.armies).toBe(4);
    const army = map.armies[0];
    const reach = reachableTiles(map, army);
    expect(reach.get(`${army.position.q},${army.position.r}`)).toBe(0);
    expect(reach.size).toBeGreaterThan(1);
  });
});
