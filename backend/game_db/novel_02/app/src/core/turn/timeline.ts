import type { BattleState, LogEntry, SideState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { Side } from "../types/effect";
import type { BattleVisualEvent, BattleVisualStep, BattleVisualZone } from "../types/visual";
import type { GameAction } from "./actions";
import { applyAction, type ApplyResult } from "./reducer";

export interface TimelineApplyResult extends ApplyResult {
  timeline: BattleVisualStep[];
}

type ActionRunner = (state: BattleState, action: GameAction, ctx: BattleContext) => ApplyResult;

interface LocatedCard {
  cardId: string;
  zone: BattleVisualZone;
}

interface LocatedUnit {
  instanceId: string;
  cardId: string;
  hp: number;
  zone: BattleVisualZone;
}

export function applyActionWithTimeline(state: BattleState, action: GameAction, ctx: BattleContext): TimelineApplyResult {
  return applyActionWithTimelineRunner(state, action, ctx, applyAction);
}

export function applyActionWithTimelineRunner(
  state: BattleState,
  action: GameAction,
  ctx: BattleContext,
  runner: ActionRunner,
): TimelineApplyResult {
  const timeline: BattleVisualStep[] = [];
  let previous = cloneBattleState(state);
  const originalPush = Array.prototype.push;

  state.log.push = function patchedPush(...entries: LogEntry[]): number {
    const length = originalPush.apply(this, entries);
    for (const entry of entries) {
      const snapshot = cloneBattleState(state);
      timeline.push(...buildSteps(previous, snapshot, entry, timeline.length));
      previous = snapshot;
    }
    return length;
  };

  try {
    const result = runner(state, action, ctx);
    if (result.ok) {
      const finalSnapshot = cloneBattleState(state);
      if (timeline.length === 0 || timeline[timeline.length - 1]?.stateSnapshot !== finalSnapshot) {
        timeline.push({
          id: `visual-${timeline.length}-settle`,
          stateSnapshot: finalSnapshot,
          events: [],
          durationMs: 140,
        });
      }
    }
    return { ...result, timeline };
  } finally {
    delete (state.log as { push?: unknown }).push;
  }
}

function cloneBattleState(state: BattleState): BattleState {
  return structuredClone({ ...state, log: [...state.log] });
}

function buildSteps(before: BattleState, after: BattleState, entry: LogEntry, startIndex: number): BattleVisualStep[] {
  const events = buildEvents(before, after, entry);
  const healthEvents = events.filter((event): event is Extract<BattleVisualEvent, { type: "damage" | "heal" }> => event.type === "damage" || event.type === "heal");
  if (entry.kind === "TROOP_VS_TROOP" && healthEvents.length > 1) {
    const steps: BattleVisualStep[] = [];
    let current = cloneBattleState(before);
    healthEvents.forEach((event, index) => {
      current = cloneBattleState(current);
      applyHealthEventToSnapshot(current, event);
      const stepEvents: BattleVisualEvent[] = index === 0
        ? events.filter((candidate) => candidate.type !== "damage" && candidate.type !== "heal")
        : [];
      stepEvents.push(event);
      steps.push({
        id: `visual-${startIndex + index}-${entry.kind}-${index}`,
        stateSnapshot: current,
        events: stepEvents,
        durationMs: index === 0 ? 520 : 420,
      });
    });
    steps[steps.length - 1] = { ...steps[steps.length - 1]!, stateSnapshot: after };
    return steps;
  }

  return [{
    id: `visual-${startIndex}-${entry.kind}`,
    stateSnapshot: after,
    events,
    durationMs: durationForLog(entry),
  }];
}

function buildEvents(before: BattleState, after: BattleState, entry: LogEntry): BattleVisualEvent[] {
  const events: BattleVisualEvent[] = [{ type: "log", kind: entry.kind, text: entry.text }];
  events.push(...buildHealthEvents(before, after, entry));
  const move = buildCardMoveEvent(before, after, entry);
  if (move) events.push(move);
  const boardEvent = buildBoardEvent(after, entry);
  if (boardEvent) events.push(boardEvent);
  return events;
}

function buildHealthEvents(before: BattleState, after: BattleState, entry: LogEntry): BattleVisualEvent[] {
  const events: BattleVisualEvent[] = [];
  if (entry.kind === "TROOP_VS_TROOP") {
    const ordered = buildTroopAttackHealthEvents(before, after, entry);
    if (ordered.length > 0) return ordered;
  }
  for (const side of SIDES) {
    const beforeHero = side === "player" ? before.player.hero : before.enemy.hero;
    const afterHero = side === "player" ? after.player.hero : after.enemy.hero;
    if (beforeHero.hp !== afterHero.hp) {
      events.push({
        type: beforeHero.hp > afterHero.hp ? "damage" : "heal",
        target: { kind: "hero", side },
        amount: Math.abs(beforeHero.hp - afterHero.hp),
        previousHp: beforeHero.hp,
        newHp: afterHero.hp,
      });
    }
  }

  const beforeUnits = locateUnits(before);
  const afterUnits = locateUnits(after);
  for (const [instanceId, beforeUnit] of beforeUnits) {
    const afterUnit = afterUnits.get(instanceId);
    if (!afterUnit || beforeUnit.hp === afterUnit.hp) continue;
    events.push({
      type: beforeUnit.hp > afterUnit.hp ? "damage" : "heal",
      target: afterUnit.zone,
      amount: Math.abs(beforeUnit.hp - afterUnit.hp),
      previousHp: beforeUnit.hp,
      newHp: afterUnit.hp,
      targetInstanceId: instanceId,
      targetCardId: afterUnit.cardId,
    });
  }
  return events;
}

function buildTroopAttackHealthEvents(before: BattleState, after: BattleState, entry: LogEntry): Array<Extract<BattleVisualEvent, { type: "damage" | "heal" }>> {
  const payload = entry.payload ?? {};
  const defenderInstanceId = typeof payload.defenderInstanceId === "string" ? payload.defenderInstanceId : undefined;
  const attackerInstanceId = typeof payload.attackerInstanceId === "string" ? payload.attackerInstanceId : undefined;
  const beforeUnits = locateUnits(before);
  const afterUnits = locateUnits(after);
  const events: Array<Extract<BattleVisualEvent, { type: "damage" | "heal" }>> = [];
  for (const instanceId of [defenderInstanceId, attackerInstanceId]) {
    if (!instanceId) continue;
    const beforeUnit = beforeUnits.get(instanceId);
    const afterUnit = afterUnits.get(instanceId);
    if (!beforeUnit || !afterUnit || beforeUnit.hp === afterUnit.hp) continue;
    events.push({
      type: beforeUnit.hp > afterUnit.hp ? "damage" : "heal",
      target: afterUnit.zone,
      amount: Math.abs(beforeUnit.hp - afterUnit.hp),
      previousHp: beforeUnit.hp,
      newHp: afterUnit.hp,
      targetInstanceId: instanceId,
      targetCardId: afterUnit.cardId,
    });
  }
  return events;
}

function applyHealthEventToSnapshot(state: BattleState, event: Extract<BattleVisualEvent, { type: "damage" | "heal" }>): void {
  if (event.target.kind === "hero") {
    getSideState(state, event.target.side).hero.hp = event.newHp;
    return;
  }
  if (!event.targetInstanceId) return;
  const unit = locateMutableUnit(state, event.targetInstanceId);
  if (unit) unit.hp = event.newHp;
}

function locateMutableUnit(state: BattleState, instanceId: string): TroopInstance | null {
  for (const side of SIDES) {
    const sideState = getSideState(state, side);
    for (const troop of sideState.troopSlots) {
      if (troop?.instanceId === instanceId) return troop;
    }
    if (sideState.frontlineSlot?.instanceId === instanceId) return sideState.frontlineSlot;
  }
  if (state.rift?.occupant?.instanceId === instanceId) return state.rift.occupant;
  return null;
}

function buildCardMoveEvent(before: BattleState, after: BattleState, entry: LogEntry): BattleVisualEvent | null {
  const payload = entry.payload ?? {};
  const cardId = typeof payload.cardId === "string" ? payload.cardId : undefined;
  const instanceId = typeof payload.instanceId === "string" ? payload.instanceId : undefined;

  if (cardId && (entry.kind === "PLAY_TROOP" || entry.kind === "PLAY_DEVICE")) {
    const slotIndex = readNumber(payload.slotIndex, findTroopSlotIndex(after, entry.side, instanceId));
    return {
      type: "cardMove",
      cardId,
      cardInstanceId: findRemovedHandCard(before, after, entry.side, cardId),
      from: { kind: "hand", side: entry.side },
      to: { kind: "troopSlot", side: entry.side, slotIndex: Math.max(0, slotIndex) },
    };
  }

  if (cardId && entry.kind === "PLAY_TROOP_RIFT") {
    return {
      type: "cardMove",
      cardId,
      cardInstanceId: findRemovedHandCard(before, after, entry.side, cardId),
      from: { kind: "hand", side: entry.side },
      to: { kind: "rift" },
    };
  }

  if (cardId && (entry.kind === "PLAY_SPELL" || entry.kind === "PLAY_ACTION")) {
    return {
      type: "cardMove",
      cardId,
      cardInstanceId: findRemovedHandCard(before, after, entry.side, cardId),
      from: { kind: "hand", side: entry.side },
      to: { kind: "graveyard", side: entry.side },
    };
  }

  if (cardId && entry.kind === "PLAY_EQUIPMENT") {
    return {
      type: "cardMove",
      cardId,
      cardInstanceId: findRemovedHandCard(before, after, entry.side, cardId),
      from: { kind: "hand", side: entry.side },
      to: { kind: "equipment", side: entry.side },
    };
  }

  if (cardId && entry.kind === "PLAY_FIELD") {
    return {
      type: "cardMove",
      cardId,
      cardInstanceId: findRemovedHandCard(before, after, entry.side, cardId),
      from: { kind: "hand", side: entry.side },
      to: { kind: "field", side: entry.side },
    };
  }

  if (entry.kind === "DRAW" || entry.kind === "LUCKY_DRAW" || entry.kind === "RIFT_RESONANCE") {
    const moved = findNewCards(before, after, entry.side, "hand");
    const first = moved[0];
    if (first) {
      return {
        type: "cardMove",
        cardId: first.cardId,
        cardInstanceId: first.instanceId,
        from: { kind: "deck", side: entry.side },
        to: { kind: "hand", side: entry.side },
      };
    }
  }

  if (entry.kind === "DISCARD") {
    const moved = findNewCards(before, after, entry.side, "graveyard")[0];
    if (moved) {
      return {
        type: "cardMove",
        cardId: moved.cardId,
        cardInstanceId: moved.instanceId,
        from: { kind: "hand", side: entry.side },
        to: { kind: "graveyard", side: entry.side },
      };
    }
  }

  const changed = findMovedCard(before, after);
  if (changed) return { type: "cardMove", cardId: changed.cardId, cardInstanceId: changed.instanceId, from: changed.from, to: changed.to };
  return null;
}

function buildBoardEvent(after: BattleState, entry: LogEntry): BattleVisualEvent | null {
  const payload = entry.payload ?? {};
  const instanceId = typeof payload.instanceId === "string" ? payload.instanceId : undefined;
  const cardId = typeof payload.cardId === "string" ? payload.cardId : undefined;
  if (!instanceId || !cardId) return null;

  if (entry.kind === "TROOP_DESTROYED") {
    return {
      type: "destroy",
      target: readSide(payload.side) ? findUnitZone(after, instanceId) ?? { kind: "unknown", side: readSide(payload.side) ?? undefined } : { kind: "unknown" },
      cardId,
      instanceId,
    };
  }

  if (entry.kind === "SUMMON" || entry.kind === "DEVICE_REBUILD" || entry.kind === "RIFT_CALL") {
    return {
      type: "summon",
      target: findUnitZone(after, instanceId) ?? { kind: "unknown", side: entry.side },
      cardId,
      instanceId,
    };
  }

  return null;
}

const SIDES: Side[] = ["player", "enemy"];

function locateCards(state: BattleState): Map<string, LocatedCard> {
  const cards = new Map<string, LocatedCard>();
  for (const side of SIDES) {
    const sideState = getSideState(state, side);
    sideState.hand.forEach((card, index) => cards.set(card.instanceId, { cardId: card.cardId, zone: { kind: "hand", side, index } }));
    sideState.deck.forEach((card, index) => cards.set(card.instanceId, { cardId: card.cardId, zone: { kind: "deck", side, index } }));
    sideState.graveyard.forEach((card, index) => cards.set(card.instanceId, { cardId: card.cardId, zone: { kind: "graveyard", side, index } }));
    sideState.troopSlots.forEach((troop, slotIndex) => {
      if (troop) cards.set(troop.instanceId, { cardId: troop.cardId, zone: { kind: "troopSlot", side, slotIndex } });
    });
    if (sideState.frontlineSlot) cards.set(sideState.frontlineSlot.instanceId, { cardId: sideState.frontlineSlot.cardId, zone: { kind: "frontline", side } });
  }
  if (state.rift?.occupant) cards.set(state.rift.occupant.instanceId, { cardId: state.rift.occupant.cardId, zone: { kind: "rift" } });
  return cards;
}

function locateUnits(state: BattleState): Map<string, LocatedUnit> {
  const units = new Map<string, LocatedUnit>();
  for (const side of SIDES) {
    const sideState = getSideState(state, side);
    sideState.troopSlots.forEach((troop, slotIndex) => {
      if (troop) units.set(troop.instanceId, unitAt(troop, { kind: "troopSlot", side, slotIndex }));
    });
    if (sideState.frontlineSlot) units.set(sideState.frontlineSlot.instanceId, unitAt(sideState.frontlineSlot, { kind: "frontline", side }));
  }
  if (state.rift?.occupant) units.set(state.rift.occupant.instanceId, unitAt(state.rift.occupant, { kind: "rift" }));
  return units;
}

function unitAt(troop: TroopInstance, zone: BattleVisualZone): LocatedUnit {
  return { instanceId: troop.instanceId, cardId: troop.cardId, hp: troop.hp, zone };
}

function getSideState(state: BattleState, side: Side): SideState {
  return side === "player" ? state.player : state.enemy;
}

function findRemovedHandCard(before: BattleState, after: BattleState, side: Side, cardId: string): string | undefined {
  const afterIds = new Set(getSideState(after, side).hand.map((card) => card.instanceId));
  return getSideState(before, side).hand.find((card) => card.cardId === cardId && !afterIds.has(card.instanceId))?.instanceId;
}

function findNewCards(before: BattleState, after: BattleState, side: Side, zone: "hand" | "graveyard"): Array<{ instanceId: string; cardId: string }> {
  const beforeIds = new Set(getSideState(before, side)[zone].map((card) => card.instanceId));
  return getSideState(after, side)[zone].filter((card) => !beforeIds.has(card.instanceId));
}

function findMovedCard(before: BattleState, after: BattleState): { instanceId: string; cardId: string; from: BattleVisualZone; to: BattleVisualZone } | null {
  const beforeCards = locateCards(before);
  const afterCards = locateCards(after);
  for (const [instanceId, afterCard] of afterCards) {
    const beforeCard = beforeCards.get(instanceId);
    if (!beforeCard) continue;
    if (zoneKey(beforeCard.zone) !== zoneKey(afterCard.zone)) {
      return { instanceId, cardId: afterCard.cardId, from: beforeCard.zone, to: afterCard.zone };
    }
  }
  return null;
}

function findUnitZone(state: BattleState, instanceId: string): BattleVisualZone | null {
  return locateUnits(state).get(instanceId)?.zone ?? null;
}

function findTroopSlotIndex(state: BattleState, side: Side, instanceId: string | undefined): number {
  if (!instanceId) return 0;
  return getSideState(state, side).troopSlots.findIndex((troop) => troop?.instanceId === instanceId);
}

function readSide(value: unknown): Side | null {
  return value === "player" || value === "enemy" ? value : null;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function zoneKey(zone: BattleVisualZone): string {
  return JSON.stringify(zone);
}

function durationForLog(entry: LogEntry): number {
  if (entry.kind.startsWith("DAMAGE") || entry.kind.includes("DRAIN") || entry.kind.includes("BURST")) return 520;
  if (entry.kind.startsWith("PLAY") || entry.kind === "DRAW" || entry.kind === "DISCARD") return 640;
  if (entry.kind === "TROOP_VS_TROOP" || entry.kind === "TROOP_VS_HERO") return 760;
  if (entry.kind === "TROOP_DESTROYED") return 460;
  return 360;
}
