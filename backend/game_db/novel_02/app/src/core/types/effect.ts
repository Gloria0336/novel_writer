import type { Keyword } from "./keyword";

export type Side = "player" | "enemy";

export type TargetSide = Side | "self" | "all";

export type EntityType = "hero" | "troop";

export interface TargetFilter {
  side?: TargetSide;
  entity?: EntityType | "any";
  keyword?: Keyword;
  minHpPct?: number;
  maxHpPct?: number;
}

export type TargetSelector =
  | { kind: "self" }
  | { kind: "playerHero" }
  | { kind: "enemyHero" }
  | { kind: "single"; filter: TargetFilter; pickedInstanceId?: string }
  | { kind: "all"; filter: TargetFilter }
  | { kind: "random"; filter: TargetFilter; count: number };

export type AmountExpr =
  | { kind: "const"; value: number }
  | { kind: "atk"; bonus?: number; mult?: number }
  | { kind: "spellsCastThisGame"; mult: number }
  | { kind: "spellsCastThisTurn"; mult: number }
  | { kind: "alliesOnBoard"; mult: number; bonus?: number }
  | { kind: "rage"; mult: number; bonus?: number }
  | { kind: "command"; mult: number; bonus?: number };

export type Duration =
  | { kind: "permanent" }
  | { kind: "thisTurn" }
  | { kind: "turns"; count: number };

export interface StatModifier {
  hp?: number;
  atk?: number;
  def?: number;
  cmd?: number;
}

export type Effect =
  | { kind: "damage"; target: TargetSelector; amount: AmountExpr; ignoreDef?: boolean; ignoreGuard?: boolean; lifesteal?: number }
  | { kind: "heal"; target: TargetSelector; amount: AmountExpr }
  | { kind: "draw"; count: number }
  | { kind: "discard"; count: number }
  | { kind: "summon"; cardId: string; count: number; side: TargetSide }
  | { kind: "gauge"; delta: number; side: TargetSide }
  | { kind: "morale"; delta: number }
  | { kind: "mana"; delta: number; temporary?: boolean }
  | { kind: "armor"; amount: number; target?: TargetSelector }
  | { kind: "buff"; target: TargetSelector; mod: StatModifier; duration: Duration }
  | { kind: "addKeyword"; target: TargetSelector; keyword: Keyword; duration: Duration }
  | { kind: "freeze"; target: TargetSelector; turns: number }
  | { kind: "stability"; delta: number }
  | { kind: "search"; predicate: { type?: string }; toHand: boolean; costMod?: number }
  | { kind: "destroyField" }
  | { kind: "scripted"; tag: string; payload?: unknown };
