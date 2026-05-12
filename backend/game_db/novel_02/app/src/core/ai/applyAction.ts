/**
 * 將 CandidateAction 套用到 BattleState。
 * 大多數動作走既有 reducer（applyAction），只有「巢穴池召喚」是特例（不走手牌）。
 */
import type { BattleState } from "../types/battle";
import type { BattleContext } from "../types/context";
import { applyAction as reducerApply } from "../turn/reducer";
import { createTroopInstance } from "../turn/factories";
import { checkVictory } from "../turn/phases";
import { reapDeadTroops } from "../effects/registry";
import type { CandidateAction } from "./types";

export interface AIApplyResult {
  ok: boolean;
  reason?: string;
}

export function applyAIAction(state: BattleState, ctx: BattleContext, action: CandidateAction): AIApplyResult {
  if (state.result !== "ongoing") return { ok: false, reason: "battle ended" };

  switch (action.kind) {
    case "endTurn":
      return { ok: true };

    case "deployFromPool": {
      // 巢穴模式：從卡池直接召喚到指定 slot（不走手牌）
      const card = ctx.getCard(action.cardId);
      if (card.type !== "troop") return { ok: false, reason: "not a troop" };
      const slot = state.enemy.troopSlots;
      if (action.slotIdx < 0 || action.slotIdx >= slot.length) return { ok: false, reason: "invalid slot" };
      if (slot[action.slotIdx] !== null) return { ok: false, reason: "slot occupied" };
      const inst = createTroopInstance(state, card);
      slot[action.slotIdx] = inst;
      state.log.push({
        turn: state.turn,
        side: "enemy",
        kind: "AI_DEPLOY",
        text: `召喚 ${card.name}`,
        payload: { cardId: card.id, instanceId: inst.instanceId, slotIdx: action.slotIdx },
      });
      // onPlay 一般在「部署」時觸發；池召喚對齊舊 lairAI 不觸發 onPlay（沿用 effects/registry summon 分支：召喚 ≠ 部署）。
      reapDeadTroops(state, ctx, "enemy");
      checkVictory(state);
      return { ok: true };
    }

    case "deployFromHand": {
      const idx = state.enemy.hand.findIndex((c) => c.instanceId === action.cardInstanceId);
      if (idx < 0) return { ok: false, reason: "card not in hand" };
      return toApply(reducerApply(state, { type: "PLAY_TROOP", handIndex: idx, slotIndex: action.slotIdx }, ctx));
    }

    case "spell": {
      const idx = state.enemy.hand.findIndex((c) => c.instanceId === action.cardInstanceId);
      if (idx < 0) return { ok: false, reason: "card not in hand" };
      return toApply(reducerApply(state, { type: "PLAY_SPELL", handIndex: idx, targetInstanceId: action.targetRef }, ctx));
    }

    case "attack":
      return toApply(reducerApply(state, {
        type: "TROOP_ATTACK",
        attackerInstanceId: action.attackerInstanceId,
        targetInstanceId: action.target === "hero" ? "H_player" : action.target,
      }, ctx));

    case "skill":
      return toApply(reducerApply(state, {
        type: "USE_SKILL",
        skillId: action.skillId,
        targetInstanceId: action.targetRef,
      }, ctx));

    case "ultimate":
      return toApply(reducerApply(state, {
        type: "USE_ULTIMATE",
        targetInstanceId: action.targetRef,
      }, ctx));
  }
}

function toApply(r: { ok: boolean; reason?: string }): AIApplyResult {
  return r;
}
