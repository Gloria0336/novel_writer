import type { BattleState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { Side } from "../types/effect";
import type { DeviceCard, ReactionEvent } from "../types/card";
import { executeEffects } from "./registry";
import { getSide, otherSide } from "../selectors/battle";

/**
 * 自動反應系統 — 不採全域 EventBus，而以 reducer hook 點 + 掃描 units' onReaction 的方式驅動。
 *
 * 事件對應的「反應方」：
 *  - enemySpellCast        ：對立面（玩家施法 → 敵方器具反應；敵方施法 → 玩家器具反應）
 *  - enemyHeroAttacked     ：被攻擊方（自家英雄被攻擊 → 自家器具反應）
 *  - allyTroopDestroyed    ：兵力陣亡的同陣營（兵力陣亡 → 該方器具反應）
 *  - enemyEquipmentPlayed  ：對立面（玩家裝備上場 → 敵方器具反應；敵方裝備上場 → 玩家器具反應）
 *
 * 遞迴保護：透過 depth 與 currentReactionSource 兩道防線，避免「反應觸發反應」無限循環。
 */

const REACTION_DEPTH = new WeakMap<BattleState, number>();
const REACTION_LOCK = new WeakMap<BattleState, Set<string>>();
const MAX_DEPTH = 8;

export interface ReactionInvocation {
  /** 事件名稱。 */
  event: ReactionEvent;
  /** 觸發事件的執行方（例如玩家施法時為 "player"）。 */
  actorSide: Side;
}

export function triggerReactions(state: BattleState, ctx: BattleContext, invocation: ReactionInvocation): void {
  const depth = REACTION_DEPTH.get(state) ?? 0;
  if (depth >= MAX_DEPTH) return;
  REACTION_DEPTH.set(state, depth + 1);
  try {
    const reactingSide = resolveReactingSide(invocation);
    const reactors = collectReactors(state, ctx, reactingSide, invocation.event);
    if (reactors.length === 0) return;

    const lock = REACTION_LOCK.get(state) ?? new Set<string>();
    REACTION_LOCK.set(state, lock);

    for (const r of reactors) {
      const key = `${r.instanceId}:${invocation.event}`;
      if (lock.has(key)) continue;
      lock.add(key);
      try {
        for (const trigger of r.triggers) {
          if (state.result !== "ongoing") return;
          executeEffects(trigger.effects, {
            state,
            ctx,
            sourceSide: reactingSide,
            sourceKind: "passive",
            sourceInstanceId: r.instanceId,
            sourceCardId: r.cardId,
          });
        }
      } finally {
        lock.delete(key);
      }
    }
  } finally {
    REACTION_DEPTH.set(state, depth);
  }
}

function resolveReactingSide(invocation: ReactionInvocation): Side {
  switch (invocation.event) {
    case "enemySpellCast":
    case "enemyEquipmentPlayed":
      return otherSide(invocation.actorSide);
    case "enemyHeroAttacked":
      // 被攻擊方反應：actorSide 是攻擊者，反應方是另一邊
      return otherSide(invocation.actorSide);
    case "allyTroopDestroyed":
      // actorSide 已是陣亡兵力的陣營
      return invocation.actorSide;
  }
}

interface ReactorSource {
  instanceId: string;
  cardId: string;
  triggers: import("../types/card").ReactionTrigger[];
}

function collectReactors(state: BattleState, ctx: BattleContext, reactingSide: Side, event: ReactionEvent): ReactorSource[] {
  const sideState = getSide(state, reactingSide);
  const out: ReactorSource[] = [];
  for (const t of sideState.troopSlots) {
    if (!t) continue;
    if (t.frozenTurns > 0) continue; // 暈眩中跳過
    // 防禦：敵方巢穴或內部 cardId 可能不在 cards 主索引中（如測試 fixture 的 "X"），跳過以避免拋錯。
    let card;
    try {
      card = ctx.getCard(t.cardId);
    } catch {
      continue;
    }
    if (card.type !== "device") continue;
    const device = card as DeviceCard;
    if (!device.onReaction || device.onReaction.length === 0) continue;
    const triggers = device.onReaction.filter((r) => r.on === event);
    if (triggers.length > 0) out.push({ instanceId: t.instanceId, cardId: t.cardId, triggers });
  }
  return out;
}

/** 測試用：清空 reaction lock 與 depth。 */
export function _resetReactionTracking(state: BattleState): void {
  REACTION_DEPTH.delete(state);
  REACTION_LOCK.delete(state);
}

/** 便利：依事件決定 actorSide 並觸發。 */
export function triggerReactionsBySide(state: BattleState, ctx: BattleContext, event: ReactionEvent, actorSide: Side): void {
  triggerReactions(state, ctx, { event, actorSide });
}

// 為避免 TS 抱怨未使用 TroopInstance 型別 import
type _Troop = TroopInstance;
