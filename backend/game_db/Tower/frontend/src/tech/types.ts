// 科技樹型別 — 形狀對齊後端 schema/models.py 的 TechNode。
// 之後若改接後端 JSON，可直接沿用同一組型別。

export type Side = "human" | "monster";

export type ResourceKind = "research_point" | "combat_resource" | "monster_source" | "slave";

export type TechCategory =
  | "gene"
  | "weapon"
  | "fortification"
  | "recon"
  | "evolution"
  | "monster_research"
  | "logistics";

export type RaceGroup = "greenskins" | "fleshes" | "fures" | "undeads" | "demons";

export interface TechNode {
  id: string;
  name: string;
  category: TechCategory;
  side: Side;
  cost: Partial<Record<ResourceKind, number>>;
  prerequisites: string[];
  effects: Record<string, number>;
  description: string;
  race_group?: RaceGroup; // 進化節點專屬：標示屬於哪個種族群組
}

export type TechCatalog = Record<string, TechNode>;
