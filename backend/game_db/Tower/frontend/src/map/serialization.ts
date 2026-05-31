import type { TowerMap } from "../types";

export function serializeTowerMap(map: TowerMap): string {
  return JSON.stringify(
    {
      ...map,
      exportedAt: new Date().toISOString()
    },
    null,
    2
  );
}

export function parseTowerMapJson(raw: string): TowerMap {
  const parsed = JSON.parse(raw) as TowerMap;
  if (parsed.schemaVersion !== 2) {
    throw new Error("不支援的地圖 schemaVersion");
  }
  if (!parsed.tileMap || !Array.isArray(parsed.tileMap.tiles) || !Array.isArray(parsed.structures)) {
    throw new Error("地圖 JSON 缺少 hex tileMap 或 structures");
  }
  return {
    ...parsed,
    armies: Array.isArray(parsed.armies) ? parsed.armies : [],
    engagements: Array.isArray(parsed.engagements) ? parsed.engagements : [],
    counts: {
      ...parsed.counts,
      armies: parsed.counts?.armies ?? (Array.isArray(parsed.armies) ? parsed.armies.length : 0)
    }
  };
}
