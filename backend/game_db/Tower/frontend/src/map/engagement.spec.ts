import { describe, expect, it } from "vitest";

import { generateTowerMap, configForPresets } from "./generator";
import { detectEngagements } from "./engagement";
import type { Army, TowerMap } from "../types";

function armyAt(id: string, owner: "human" | "monster", q: number, r: number): Army {
  return {
    id,
    owner,
    position: { q, r },
    movementPoints: 4,
    units: [{ templateId: owner === "human" ? "militia" : "goblin", count: 10 }],
    eliteIds: [],
    strength: 50
  };
}

describe("detectEngagements", () => {
  it("returns no engagements for the freshly generated layout (armies on own ground)", () => {
    const map = generateTowerMap(configForPresets("m2-engage", "standard", "standard"));
    expect(map.engagements).toEqual([]);
  });

  it("flags enemy armies that share a tile as an army collision", () => {
    const map = generateTowerMap(configForPresets("m2-engage", "standard", "standard"));
    const tile = map.tileMap.tiles.find((item) => item.passable)!;
    const probe: TowerMap = {
      ...map,
      armies: [
        armyAt("h", "human", tile.coord.q, tile.coord.r),
        armyAt("m", "monster", tile.coord.q, tile.coord.r)
      ]
    };
    const engagements = detectEngagements(probe, 1);
    expect(engagements).toHaveLength(1);
    expect(engagements[0].reason).toBe("army_collision");
    expect(engagements[0].attackers).toContain("h");
    expect(engagements[0].defenders).toContain("m");
  });

  it("flags an army standing on an enemy structure as an assault", () => {
    const map = generateTowerMap(configForPresets("m2-engage", "standard", "standard"));
    const human = map.structures.find((item) => item.owner === "human")!;
    const probe: TowerMap = {
      ...map,
      armies: [armyAt("m", "monster", human.footprint[0].q, human.footprint[0].r)]
    };
    const engagements = detectEngagements(probe, 1);
    expect(engagements.some((item) => item.reason === "structure_assault" && item.structureId === human.id)).toBe(true);
  });
});
