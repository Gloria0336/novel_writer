import type { BattleState } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { TroopCard } from "../types/card";
import { aliveTroops, freeSlotIndex, getSide, otherSide } from "../selectors/battle";
import { createTroopInstance } from "../turn/factories";
import { canTroopAttack, troopVsHero, troopVsTroop } from "../combat/attack";
import { reapDeadTroops } from "../effects/registry";
import { rngPick } from "../deck/prng";
import { checkVictory } from "../turn/phases";

const LAIR_POOL = ["L01", "L02", "L03"] as const;

/**
 * 腐植巢穴 AI 行動：
 * 1. 試著召喚 1 個兵力（從 L01-L03 隨機）若有空槽
 * 2. 用所有可攻擊的兵力，全力攻擊（兵力優先制：自動鎖定玩家兵力 → 否則打英雄）
 */
export function runLairAITurn(state: BattleState, ctx: BattleContext): void {
  if (state.result !== "ongoing") return;
  const enemy = state.enemy;

  // 1. 召喚
  const slotIdx = freeSlotIndex(enemy);
  if (slotIdx >= 0) {
    const r = rngPick(state.rngState, LAIR_POOL);
    state.rngState = r.state;
    const card = ctx.getCard(r.value);
    if (card.type === "troop") {
      const inst = createTroopInstance(state, card as TroopCard);
      enemy.troopSlots[slotIdx] = inst;
      state.log.push({ turn: state.turn, side: "enemy", kind: "AI_DEPLOY", text: `巢穴召喚 ${card.name}`, payload: { cardId: card.id, instanceId: inst.instanceId } });
    }
  }

  // 2. 攻擊（按 instance order）
  const aiAttackers = aliveTroops(enemy).filter((t) => !t.summonedThisTurn || t.keywords.has("rush") || t.keywords.has("haste"));
  for (const attacker of aiAttackers) {
    if (state.result !== "ongoing") return;
    const playerTroops = aliveTroops(state.player);
    if (playerTroops.length > 0) {
      // 優先打玩家兵力（挑 ATK 最高的，避免血拼）
      const target = [...playerTroops].sort((a, b) => b.atk - a.atk)[0]!;
      const check = canTroopAttack(state, "enemy", attacker, target);
      if (check.ok) {
        troopVsTroop(attacker, target);
      }
    } else {
      const check = canTroopAttack(state, "enemy", attacker, "hero");
      if (check.ok) {
        troopVsHero(state, attacker, "enemy");
      }
    }
    reapDeadTroops(state, ctx, "enemy");
    checkVictory(state);
  }
}

/**
 * 預測 AI 下一回合意圖（顯示給玩家）。
 * 簡化：永遠是「攻擊」（紅色）。
 */
export function previewLairIntent(state: BattleState): "attack" | "deploy" | "spell" | "dimension" | "special" | "unknown" {
  return aliveTroops(state.enemy).length > 0 ? "attack" : "deploy";
}
