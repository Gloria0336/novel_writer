/**
 * 列舉敵方本回合所有合法動作。剪枝：同卡只進第一個空槽；不合法動作不進列表。
 */
import type { BattleState } from "../types/battle";
import type { BattleContext } from "../types/context";
import { aliveTroops, freeSlotIndex, hasGuardTroop } from "../selectors/battle";
import { canTroopAttack } from "../combat/attack";
import type { CandidateAction, EnemyProfile } from "./types";
import type { Effect, TargetSelector } from "../types/effect";

export function enumerateActions(state: BattleState, ctx: BattleContext, profile: EnemyProfile): CandidateAction[] {
  const out: CandidateAction[] = [];
  const enemy = state.enemy;

  // — 部署 —
  const slot = freeSlotIndex(enemy);
  if (slot >= 0) {
    if (profile.kind === "lair") {
      // 巢穴：直接從 summonPool（不消耗 mana / 不出手牌）
      for (const cardId of profile.summonPool ?? []) {
        out.push({ kind: "deployFromPool", cardId, slotIdx: slot });
      }
    } else {
      // Boss / 內戰：手牌部署 + 可選召喚池
      const seenCards = new Set<string>();
      for (const inst of enemy.hand) {
        if (seenCards.has(inst.cardId)) continue; // 同 cardId 只 enumerate 一次
        const card = ctx.getCard(inst.cardId);
        if (card.cost > enemy.manaCurrent + enemy.tempMana) continue;
        if (card.type === "troop") {
          out.push({ kind: "deployFromHand", cardInstanceId: inst.instanceId, slotIdx: slot });
          seenCards.add(inst.cardId);
        } else if (card.type === "spell") {
          for (const targetRef of enumerateEffectTargets(state, card.effects)) {
            out.push({ kind: "spell", cardInstanceId: inst.instanceId, targetRef });
          }
          seenCards.add(inst.cardId);
        }
      }
      // Boss 召喚池（如夢魔宗主的夢幻體、古魔的孳生體）— 不消耗 mana / 手牌
      for (const cardId of profile.summonPool ?? []) {
        out.push({ kind: "deployFromPool", cardId, slotIdx: slot });
      }
    }
  }

  // — 攻擊 —
  const playerHasGuard = hasGuardTroop(state.player);
  for (const attacker of aliveTroops(enemy)) {
    // 對每個玩家方兵力嘗試
    for (const t of aliveTroops(state.player)) {
      const check = canTroopAttack(state, "enemy", attacker, t);
      if (check.ok) {
        out.push({ kind: "attack", attackerInstanceId: attacker.instanceId, target: t.instanceId });
      }
    }
    // 對英雄（兵力優先制 + 守護由 canTroopAttack 處理）
    const checkHero = canTroopAttack(state, "enemy", attacker, "hero");
    if (checkHero.ok && !playerHasGuard) {
      out.push({ kind: "attack", attackerInstanceId: attacker.instanceId, target: "hero" });
    }
  }

  // — 技能 / 終極技（非 lair）—
  if (profile.kind !== "lair") {
    const heroDef = ctx.getHero(enemy.hero.defId);
    for (const skill of heroDef.actives) {
      if (skill.passive) continue;
      if (!canPaySkill(state, skill.cost)) continue;
      const targets = enumerateEffectTargets(state, skill.effects);
      for (const targetRef of targets) {
        out.push({ kind: "skill", skillId: skill.id, targetRef });
      }
    }
    if (!enemy.hero.flags.ultimateUsed && canPaySkill(state, heroDef.ultimate.cost)) {
      const targets = enumerateEffectTargets(state, heroDef.ultimate.effects);
      for (const targetRef of targets) {
        out.push({ kind: "ultimate", skillId: heroDef.ultimate.id, targetRef });
      }
    }
  }

  // — 結束回合（永遠存在）—
  out.push({ kind: "endTurn" });
  return out;
}

function canPaySkill(state: BattleState, cost: { mana?: number; morale?: number; gauge?: number }): boolean {
  const h = state.enemy.hero;
  const totalMana = state.enemy.manaCurrent + state.enemy.tempMana;
  if (cost.mana && cost.mana > totalMana) return false;
  if (cost.morale && cost.morale > h.morale) return false;
  if (cost.gauge && cost.gauge > h.gaugeValue) return false;
  return true;
}

/**
 * 列舉效果鏈中第一個 single-target 效果的合法目標。
 * 若沒有 single-target 效果，回傳 [undefined]（一個無目標候選）。
 */
function enumerateEffectTargets(state: BattleState, effects: readonly Effect[]): (string | undefined)[] {
  for (const e of effects) {
    if (!("target" in e) || !e.target) continue;
    const sel = e.target as TargetSelector;
    if (sel.kind !== "single") continue;
    return collectSingleTargets(state, sel);
  }
  return [undefined];
}

function collectSingleTargets(state: BattleState, sel: TargetSelector & { kind: "single" }): (string | undefined)[] {
  const wantHero = !sel.filter.entity || sel.filter.entity === "any" || sel.filter.entity === "hero";
  const wantTroop = !sel.filter.entity || sel.filter.entity === "any" || sel.filter.entity === "troop";
  // AI 從 enemy 立場：filter.side "enemy" 對 enemy 來說 = 玩家側；"self" = 我方；"all" = 雙方
  const wantPlayer = !sel.filter.side || sel.filter.side === "enemy" || sel.filter.side === "all";
  const wantEnemy = sel.filter.side === "self" || sel.filter.side === "all";
  const out: (string | undefined)[] = [];
  if (wantHero && wantPlayer) out.push("H_player");
  if (wantHero && wantEnemy) out.push("H_enemy");
  if (wantTroop && wantPlayer) for (const t of aliveTroops(state.player)) out.push(t.instanceId);
  if (wantTroop && wantEnemy) for (const t of aliveTroops(state.enemy)) out.push(t.instanceId);
  if (out.length === 0) out.push(undefined);
  return out;
}
