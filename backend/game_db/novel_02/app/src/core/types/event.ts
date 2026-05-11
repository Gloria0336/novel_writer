import type { Side } from "./effect";
import type { TroopInstance } from "./battle";

export type TriggerEvent =
  | { type: "TURN_START"; side: Side; turn: number }
  | { type: "TURN_END"; side: Side; turn: number }
  | { type: "TROOP_ENTER"; instanceId: string; side: Side }
  | { type: "TROOP_DESTROYED"; instance: TroopInstance; side: Side; killerSide?: Side }
  | { type: "SPELL_CAST"; cardId: string; side: Side }
  | { type: "ACTION_PLAY"; cardId: string; side: Side; hit: boolean }
  | { type: "EQUIPMENT_PLAY"; cardId: string; side: Side }
  | { type: "FIELD_PLAY"; cardId: string; side: Side }
  | { type: "DAMAGE_DEALT"; source: Side; targetSide: Side; amount: number; isHero: boolean }
  | { type: "HERO_DAMAGED"; side: Side; amount: number; previousHp: number; newHp: number }
  | { type: "STABILITY_CHANGE"; previousValue: number; newValue: number };

export interface LogEntryDraft {
  kind: string;
  text: string;
  payload?: Record<string, unknown>;
}
