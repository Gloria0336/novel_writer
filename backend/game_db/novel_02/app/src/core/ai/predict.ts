/**
 * 純讀取的動作預測：給定 state + candidate action，估算各種數值 delta。
 * 不能 mutate state。複雜效果（scripted、buff 鏈）用近似值估計。
 */
import type { BattleState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { CandidateAction } from "./types";
import type { Card, TroopCard } from "../types/card";
import type { Effect, TargetSelector } from "../types/effect";
import { aliveTroops, findTroopBySide, getSide } from "../selectors/battle";
import { evalAmount } from "../effects/amount";

export interface Prediction {
  /** 玩家英雄受到的傷害（正值）。 */
  damageToPlayerHero: number;
  /** 玩家側兵力被擊殺的 instanceId 與各自原 atk/keyword 價值。 */
  killedPlayerTroops: { instanceId: string; value: number }[];
  /** 玩家側兵力受到的非致死傷害總量（用於 damageDealt）。 */
  damageToPlayerTroopsNonLethal: number;
  /** 直接打死玩家英雄？ */
  killsPlayerHero: boolean;

  /** 我方英雄受到的傷害（自傷/反擊到英雄）。 */
  damageToSelfHero: number;
  /** 我方兵力被擊殺的數量與 atk 價值總和。 */
  ownTroopLossValue: number;
  /** 我方兵力受到的非致死傷害。 */
  damageToOwnTroopsNonLethal: number;

  /** 玩家穩定度的削減量（正值代表玩家穩定度下降）。 */
  stabilityDrain: number;
  /** 我方量表增量（正值更好）。 */
  gaugeDelta: number;

  /** 動作成本（用於 resourceEfficiency）。 */
  manaCost: number;
  moraleCost: number;
  gaugeCost: number;
}

const EMPTY: Prediction = {
  damageToPlayerHero: 0,
  killedPlayerTroops: [],
  damageToPlayerTroopsNonLethal: 0,
  killsPlayerHero: false,
  damageToSelfHero: 0,
  ownTroopLossValue: 0,
  damageToOwnTroopsNonLethal: 0,
  stabilityDrain: 0,
  gaugeDelta: 0,
  manaCost: 0,
  moraleCost: 0,
  gaugeCost: 0,
};

const KEYWORD_VALUE: Record<string, number> = {
  lethal: 3,
  guard: 2,
  rush: 1,
  haste: 1,
  pierce: 1,
  menace: 1,
  siege: 1,
  lifesteal: 1,
};

export function troopValue(t: TroopInstance): number {
  let v = t.atk;
  for (const kw of t.keywords) v += KEYWORD_VALUE[kw] ?? 0;
  return v;
}

/** 預測一次兵力攻擊的結果（不 mutate）。 */
function predictAttack(state: BattleState, attackerId: string, targetRef: "hero" | string): Prediction {
  const att = findTroopBySide(state, attackerId);
  if (!att || att.side !== "enemy") return EMPTY;
  const attacker = att.troop;
  const aPierce = attacker.keywords.has("pierce");
  const aLethal = attacker.keywords.has("lethal");

  if (targetRef === "hero") {
    const player = state.player.hero;
    const dmg = aPierce ? attacker.atk : Math.max(0, attacker.atk - player.def);
    const absorbed = Math.min(player.armor, dmg);
    const finalDmg = dmg - absorbed;
    return {
      ...EMPTY,
      damageToPlayerHero: finalDmg,
      killsPlayerHero: finalDmg >= player.hp,
    };
  }

  const found = findTroopBySide(state, targetRef);
  if (!found || found.side !== "player") return EMPTY;
  const defender = found.troop;
  const dPierce = defender.keywords.has("pierce");
  const dLethal = defender.keywords.has("lethal");

  const dmgToDef = aPierce ? attacker.atk : Math.max(0, attacker.atk - defender.def);
  const dmgToAtt = dPierce ? defender.atk : Math.max(0, defender.atk - attacker.def);
  const defKilled = dmgToDef >= defender.hp || (aLethal && dmgToDef > 0);
  const attKilled = dmgToAtt >= attacker.hp || (dLethal && dmgToAtt > 0);

  return {
    ...EMPTY,
    damageToPlayerTroopsNonLethal: defKilled ? 0 : dmgToDef,
    killedPlayerTroops: defKilled ? [{ instanceId: defender.instanceId, value: troopValue(defender) }] : [],
    damageToOwnTroopsNonLethal: attKilled ? 0 : dmgToAtt,
    ownTroopLossValue: attKilled ? troopValue(attacker) : 0,
  };
}

/** 預測部署 troop card（從手牌或召喚池）的入場價值。 */
function predictDeploy(state: BattleState, ctx: BattleContext, cardId: string, costFromHand: number): Prediction {
  const card = ctx.getCard(cardId);
  if (card.type !== "troop") return { ...EMPTY, manaCost: costFromHand };
  const troopCard = card as TroopCard;
  const out: Prediction = { ...EMPTY, manaCost: costFromHand };

  // 英雄量表 onTroopEnter
  const heroDef = ctx.getHero(state.enemy.hero.defId);
  if (heroDef.gauge.onTroopEnter) out.gaugeDelta += heroDef.gauge.onTroopEnter;

  // 入場曲（onPlay）— 只粗估 damage / stability / gauge
  if (troopCard.onPlay) accumulateEffects(state, troopCard.onPlay, out, "enemy");
  return out;
}

/** 預測技能/終極技/法術 — 用 evalAmount 做近似（不 mutate）。 */
function predictSkillLike(
  state: BattleState,
  effects: readonly Effect[],
  cost: { mana?: number; morale?: number; gauge?: number },
): Prediction {
  const out: Prediction = {
    ...EMPTY,
    manaCost: cost.mana ?? 0,
    moraleCost: cost.morale ?? 0,
    gaugeCost: cost.gauge ?? 0,
  };
  accumulateEffects(state, effects, out, "enemy");
  return out;
}

/** 把一串 effects 的預期 delta 累加進 prediction。粗估，不處理 onDestroy 連鎖。 */
function accumulateEffects(state: BattleState, effects: readonly Effect[], out: Prediction, sourceSide: "enemy"): void {
  const sideState = state.enemy;
  for (const e of effects) {
    switch (e.kind) {
      case "damage": {
        const raw = evalAmount(e.amount, sideState, state);
        const tgs = resolveTargetsForPredict(state, e.target, sourceSide);
        for (const t of tgs) {
          if (t.kind === "playerHero") {
            const dmg = e.ignoreDef ? raw : Math.max(0, raw - state.player.hero.def);
            const absorbed = Math.min(state.player.hero.armor, dmg);
            const finalDmg = dmg - absorbed;
            out.damageToPlayerHero += finalDmg;
            if (finalDmg >= state.player.hero.hp) out.killsPlayerHero = true;
          } else if (t.kind === "playerTroop" && t.troop) {
            const dmg = e.ignoreDef ? raw : Math.max(0, raw - t.troop.def);
            if (dmg >= t.troop.hp) {
              out.killedPlayerTroops.push({ instanceId: t.troop.instanceId, value: troopValue(t.troop) });
            } else {
              out.damageToPlayerTroopsNonLethal += dmg;
            }
          } else if (t.kind === "enemyHero") {
            // 對自己造傷（少見：戰嚎 SELF_DAMAGE_FIXED）
            out.damageToSelfHero += e.ignoreDef ? raw : Math.max(0, raw - state.enemy.hero.def);
          }
        }
        break;
      }
      case "gauge": {
        if (e.side === "self") out.gaugeDelta += e.delta;
        break;
      }
      case "stability": {
        if (e.delta < 0) out.stabilityDrain += -e.delta;
        break;
      }
      case "summon": {
        // 量表 onTroopEnter（為自己召喚）
        if (e.side === "self") {
          const heroDef = ctx_safe_onTroopEnter(state);
          out.gaugeDelta += heroDef * e.count;
        }
        break;
      }
      case "scripted": {
        accumulateScripted(state, e.tag, e.payload, out);
        break;
      }
      // heal / buff / mana / armor / draw / discard / addKeyword / freeze / search / destroyField
      // 這些 v1 不直接量化 utility，由其他 consideration（survival / efficiency）間接體現
      default:
        break;
    }
  }
}

function ctx_safe_onTroopEnter(state: BattleState): number {
  // 不需要 ctx：直接從 state 不行；簡化：固定回 0。實際數值由部署時的 predictDeploy 處理。
  // 這個簡化讓 summon effect 的量表計算稍微低估，但不會錯誤。
  void state;
  return 0;
}

function accumulateScripted(state: BattleState, tag: string, payload: unknown, out: Prediction): void {
  switch (tag) {
    case "SELF_DAMAGE_FIXED": {
      const p = payload as { amount?: number } | undefined;
      out.damageToSelfHero += p?.amount ?? 0;
      break;
    }
    case "PRIMAL_AWAKENING": {
      // 蠻血酋長終極：對玩家英雄造成 (ATK + gauge×5) ×2，無視守護
      const e = state.enemy.hero;
      const dmg = (e.atk + e.gaugeValue * 5) * 2;
      const final = dmg; // ignoreDef-like 近似
      out.damageToPlayerHero += final;
      if (final >= state.player.hero.hp) out.killsPlayerHero = true;
      break;
    }
    case "EXTRA_ACTIONS":
      // 給自己加一張行動卡使用機會：v1 不量化
      break;
    default:
      // 未知 scripted：保守給 0
      break;
  }
}

type PredictTarget =
  | { kind: "playerHero" }
  | { kind: "enemyHero" }
  | { kind: "playerTroop"; troop: TroopInstance }
  | { kind: "enemyTroop"; troop: TroopInstance };

/** 從 enemy 立場解析 TargetSelector。「single」未指定時，挑「最差的玩家方目標」做近似（damage 取上限）。 */
function resolveTargetsForPredict(state: BattleState, sel: TargetSelector, sourceSide: "enemy"): PredictTarget[] {
  void sourceSide;
  switch (sel.kind) {
    case "self":
      return [{ kind: "enemyHero" }];
    case "playerHero":
      return [{ kind: "playerHero" }];
    case "enemyHero":
      // selector 命名是「對方英雄」但語意取決於 sourceSide。
      // effects/target.ts 的 resolveTargets 看的是 selector.side，"enemyHero" kind 永遠指 enemy side 的 hero。
      // 對 AI（enemy 立場）來說，敵方=玩家。為了一致，這裡保守當作對自己。
      return [{ kind: "enemyHero" }];
    case "single": {
      // 未指定 picked：列舉 filter 下所有可能目標，由評分階段挑高分
      const out: PredictTarget[] = [];
      const wantHero = !sel.filter.entity || sel.filter.entity === "any" || sel.filter.entity === "hero";
      const wantTroop = !sel.filter.entity || sel.filter.entity === "any" || sel.filter.entity === "troop";
      const wantPlayer = !sel.filter.side || sel.filter.side === "enemy" || sel.filter.side === "all";
      const wantEnemy = sel.filter.side === "self" || sel.filter.side === "all";
      if (wantHero && wantPlayer) out.push({ kind: "playerHero" });
      if (wantHero && wantEnemy) out.push({ kind: "enemyHero" });
      if (wantTroop && wantPlayer) for (const t of aliveTroops(state.player)) out.push({ kind: "playerTroop", troop: t });
      if (wantTroop && wantEnemy) for (const t of aliveTroops(state.enemy)) out.push({ kind: "enemyTroop", troop: t });
      return out;
    }
    case "all": {
      const out: PredictTarget[] = [];
      const sides = sel.filter.side === "self" ? ["enemy"] : sel.filter.side === "enemy" ? ["player"] : sel.filter.side === "all" ? ["player", "enemy"] : ["player"];
      const wantHero = !sel.filter.entity || sel.filter.entity === "any" || sel.filter.entity === "hero";
      const wantTroop = !sel.filter.entity || sel.filter.entity === "any" || sel.filter.entity === "troop";
      for (const s of sides) {
        if (wantHero) out.push({ kind: s === "player" ? "playerHero" : "enemyHero" });
        if (wantTroop) for (const t of aliveTroops(getSide(state, s as "player" | "enemy"))) {
          out.push({ kind: s === "player" ? "playerTroop" : "enemyTroop", troop: t });
        }
      }
      return out;
    }
    case "random": {
      // 近似：取所有候選的前 count 個（不抽真隨機）
      return resolveTargetsForPredict(state, { kind: "all", filter: sel.filter }, sourceSide).slice(0, sel.count);
    }
  }
}

/** 統一入口。 */
export function predictAction(state: BattleState, ctx: BattleContext, action: CandidateAction): Prediction {
  switch (action.kind) {
    case "attack":
      return predictAttack(state, action.attackerInstanceId, action.target);

    case "deployFromHand": {
      const inst = state.enemy.hand.find((c) => c.instanceId === action.cardInstanceId);
      if (!inst) return EMPTY;
      const card = ctx.getCard(inst.cardId);
      const cost = (card as Card).cost ?? 0;
      return predictDeploy(state, ctx, inst.cardId, cost);
    }
    case "deployFromPool":
      return predictDeploy(state, ctx, action.cardId, 0);

    case "spell": {
      const inst = state.enemy.hand.find((c) => c.instanceId === action.cardInstanceId);
      if (!inst) return EMPTY;
      const card = ctx.getCard(inst.cardId);
      if (card.type !== "spell") return EMPTY;
      return predictSkillLike(state, card.effects, { mana: card.cost });
    }

    case "skill": {
      const heroDef = ctx.getHero(state.enemy.hero.defId);
      const skill = heroDef.actives.find((s) => s.id === action.skillId);
      if (!skill) return EMPTY;
      return predictSkillLike(state, skill.effects, skill.cost);
    }

    case "ultimate": {
      const heroDef = ctx.getHero(state.enemy.hero.defId);
      if (heroDef.ultimate.id !== action.skillId) return EMPTY;
      return predictSkillLike(state, heroDef.ultimate.effects, heroDef.ultimate.cost);
    }

    case "endTurn":
      return EMPTY;
  }
}
