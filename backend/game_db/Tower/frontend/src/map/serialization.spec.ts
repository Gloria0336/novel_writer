import { describe, expect, it } from "vitest";

import type { TowerMap } from "../types";
import { generateTowerMap } from "./generator";
import { parseTowerMapJson } from "./serialization";

describe("parseTowerMapJson", () => {
  it("hydrates legacy exports without cartographic fields", () => {
    const map = generateTowerMap({ seed: "legacy-cartography" });
    const legacy = {
      ...map,
      terrainRegions: map.terrainRegions.map(({ id, terrainType, bounds, tags }) => ({ id, terrainType, bounds, tags }))
    } as Partial<TowerMap> & Record<string, unknown>;
    delete legacy.elevationGrid;
    delete legacy.contourLines;

    const parsed = parseTowerMapJson(JSON.stringify(legacy));
    expect(parsed.elevationGrid).toHaveLength(parsed.config.height);
    expect(parsed.contourLines.length).toBeGreaterThan(20);
    expect(parsed.terrainRegions.every((region) => region.cells.length > 0 && region.outlines.length > 0)).toBe(true);
  });
});
