import type { BattleState } from "./battle";
import type { Side } from "./effect";

export type BattleVisualZone =
  | { kind: "hand"; side: Side; index?: number }
  | { kind: "deck"; side: Side; index?: number }
  | { kind: "graveyard"; side: Side; index?: number }
  | { kind: "troopSlot"; side: Side; slotIndex: number }
  | { kind: "frontline"; side: Side }
  | { kind: "rift" }
  | { kind: "hero"; side: Side }
  | { kind: "equipment"; side: Side; slot?: string }
  | { kind: "field"; side: Side }
  | { kind: "unknown"; side?: Side };

export type BattleVisualEvent =
  | {
      type: "cardMove";
      cardId: string;
      cardInstanceId?: string;
      from: BattleVisualZone;
      to: BattleVisualZone;
    }
  | {
      type: "damage";
      target: BattleVisualZone;
      amount: number;
      previousHp: number;
      newHp: number;
      targetInstanceId?: string;
      targetCardId?: string;
    }
  | {
      type: "heal";
      target: BattleVisualZone;
      amount: number;
      previousHp: number;
      newHp: number;
      targetInstanceId?: string;
      targetCardId?: string;
    }
  | {
      type: "destroy";
      target: BattleVisualZone;
      cardId: string;
      instanceId: string;
    }
  | {
      type: "summon";
      target: BattleVisualZone;
      cardId: string;
      instanceId: string;
    }
  | {
      type: "log";
      kind: string;
      text: string;
    };

export interface BattleVisualStep {
  id: string;
  stateSnapshot: BattleState;
  events: BattleVisualEvent[];
  durationMs: number;
}
