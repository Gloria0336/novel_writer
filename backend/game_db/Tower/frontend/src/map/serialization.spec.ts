import { describe, expect, it } from "vitest";

import { generateTowerMap } from "./generator";
import { parseTowerMapJson, serializeTowerMap } from "./serialization";

describe("parseTowerMapJson", () => {
  it("round-trips the M1 hex map payload", () => {
    const map = generateTowerMap({ seed: "serialization" });
    const parsed = parseTowerMapJson(serializeTowerMap(map));
    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.tileMap.tiles).toHaveLength(map.tileMap.tiles.length);
    expect(parsed.structures).toHaveLength(map.structures.length);
    expect(parsed.armies).toHaveLength(map.armies.length);
  });

  it("rejects old graph exports", () => {
    expect(() => parseTowerMapJson(JSON.stringify({ schemaVersion: 1, nodes: [], edges: [] }))).toThrow("schemaVersion");
  });
});
