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
  if (parsed.schemaVersion !== 1) {
    throw new Error("不支援的地圖 schemaVersion");
  }
  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges) || !Array.isArray(parsed.terrainGrid)) {
    throw new Error("地圖 JSON 缺少必要欄位");
  }
  return parsed;
}
