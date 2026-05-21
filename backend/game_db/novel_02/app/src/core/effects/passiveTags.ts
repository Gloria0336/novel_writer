import type { SideState, TroopInstance } from "../types/battle";
import type { Card, EquipmentCard } from "../types/card";
import type { BattleContext } from "../types/context";
import type { Effect } from "../types/effect";

export function effectHasScriptedTag(effects: readonly Effect[] | undefined, tag: string): boolean {
  return effects?.some((e) => e.kind === "scripted" && e.tag === tag) ?? false;
}

export function effectScriptedPayload<T = unknown>(effects: readonly Effect[] | undefined, tag: string): T | undefined {
  const effect = effects?.find((e) => e.kind === "scripted" && e.tag === tag);
  return effect?.kind === "scripted" ? (effect.payload as T | undefined) : undefined;
}

export function cardHasPassiveTag(card: Card, tag: string): boolean {
  return (card.type === "troop" || card.type === "device" || card.type === "equipment") && effectHasScriptedTag(card.passive, tag);
}

export function troopHasPassiveTag(ctx: BattleContext, troop: TroopInstance, tag: string): boolean {
  try {
    const card = ctx.getCard(troop.cardId);
    return cardHasPassiveTag(card, tag);
  } catch {
    return false;
  }
}

export function sideHasEquipmentPassive(ctx: BattleContext, side: SideState, tag: string): boolean {
  return getEquipmentPassivePayloads(ctx, side, tag).length > 0;
}

export function getFirstEquipmentPassivePayload<T = unknown>(ctx: BattleContext, side: SideState, tag: string): T | undefined {
  return getEquipmentPassivePayloads<T>(ctx, side, tag)[0];
}

export function getEquipmentPassivePayloads<T = unknown>(ctx: BattleContext, side: SideState, tag: string): T[] {
  const payloads: T[] = [];
  for (const cardId of equippedCardIds(side)) {
    const card = ctx.getCard(cardId);
    if (card.type !== "equipment") continue;
    const payload = effectScriptedPayload<T>((card as EquipmentCard).passive, tag);
    if (payload !== undefined || effectHasScriptedTag((card as EquipmentCard).passive, tag)) {
      payloads.push(payload as T);
    }
  }
  return payloads;
}

export function equippedCardIds(side: SideState): string[] {
  return [side.hero.equipment.weapon, side.hero.equipment.armor, side.hero.equipment.trinket].filter((id): id is string => Boolean(id));
}

export function equippedCount(side: SideState): number {
  return equippedCardIds(side).length;
}
