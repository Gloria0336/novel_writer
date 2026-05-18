import type { BattleState, TroopInstance } from "../types/battle";
import type { Effect, Side, TargetSelector, TargetSide } from "../types/effect";
import type { BattleContext } from "../types/context";
import type { TroopCard } from "../types/card";
import type { UnitStatus } from "../types/status";
import { evalAmount, applyResonanceMultiplier, applyBerserkMultiplier, applyCommandMultiplier } from "./amount";
import { resolveTargets, HERO_TARGET_ID } from "./target";
import { applyHeroDamage, applyTroopDamage, applyLifesteal } from "../combat/damage";
import { canActionTarget } from "../combat/attack";
import { addMorale, MORALE_ACTION_HIT, MORALE_ALLY_TROOP_DESTROYED, MORALE_KILL_TROOP } from "../resource/morale";
import { addGauge, gaugeOnHeroDamaged } from "../resource/gauge";
import { applyCorruptionStageEffects, applyStabilityDelta, healingMultiplier } from "../resource/stability";
import { openRiftIfNeeded, vacateRiftIfOccupantDead, MORALE_KILL_RIFT_INFILTRATOR } from "../resource/rift";
import { drawCards } from "../deck/draw";
import { addTempMana } from "../resource/mana";
import { aliveTroops, getSide, otherSide } from "../selectors/battle";
import { createTroopInstance } from "../turn/factories";
import { addHeroAbilityFreeze, HERO_ABILITY_FREEZE_LABEL } from "./heroAbilityFreeze";
import {
  getFullGaugeActionDamageMultiplier,
  getFullGaugeHeroDamageTakenMultiplier,
  getFullGaugeSpellEffectMultiplier,
  maybeHealHeroFromFullGaugeTroopKill,
  syncFullGaugeBuffs,
} from "../resource/fullGaugeBuff";

export type EffectSourceKind = "troop_play" | "troop_destroy" | "spell" | "action" | "equipment" | "field" | "skill" | "ultimate" | "passive";

export interface EffectContext {
  state: BattleState;
  ctx: BattleContext;
  sourceSide: Side;
  sourceKind: EffectSourceKind;
  sourceInstanceId?: string;
  sourceCardId?: string;
}

export function executeEffects(effects: readonly Effect[], ec: EffectContext): void {
  for (const e of effects) {
    if (ec.state.result !== "ongoing") return;
    executeEffect(e, ec);
    syncFullGaugeBuffs(ec.state, ec.ctx);
  }
}

function applyDamageMultipliers(amount: number, ec: EffectContext): number {
  const { state, ctx, sourceSide, sourceKind } = ec;
  const side = getSide(state, sourceSide);
  const heroDef = ctx.getHero(side.hero.defId);
  const cls = ctx.getClass(heroDef.classId);

  let result = amount;

  // 法師「共鳴」：法術傷害 × (1 + stacks*0.2)
  if (sourceKind === "spell" && side.hero.gaugeValue > 0 && ctx.getRace(heroDef.raceId).gauge.id === "resonance") {
    result = applyResonanceMultiplier(result, side.hero.gaugeValue);
  }

  if (sourceKind === "spell") {
    result *= getFullGaugeSpellEffectMultiplier(state, ctx, sourceSide);
  }

  if (sourceKind === "action") {
    result *= getFullGaugeActionDamageMultiplier(state, ctx, sourceSide);
  }

  // 狂戰士「狂暴」：行動卡傷害 × (1 + 8% × hp_loss_pct/10)
  if (sourceKind === "action" && cls.keyword === "berserk") {
    const hpPctLost = ((side.hero.maxHp - side.hero.hp) / side.hero.maxHp) * 100;
    result = applyBerserkMultiplier(result, hpPctLost);
  }

  // 指揮官「號令」：行動卡傷害 × (1 + 5% × 場上兵力)
  if (sourceKind === "action" && cls.keyword === "command") {
    result = applyCommandMultiplier(result, aliveTroops(side).length);
  }

  return Math.max(0, Math.round(result));
}

function applyHealMultipliers(amount: number, ec: EffectContext): number {
  const { state, ctx, sourceSide } = ec;
  const heroDef = ctx.getHero(getSide(state, sourceSide).hero.defId);
  const cls = ctx.getClass(heroDef.classId);
  let result = amount;
  if (cls.keyword === "blessing") result = Math.round(result * 1.5);
  if (ec.sourceKind === "spell") result *= getFullGaugeSpellEffectMultiplier(state, ctx, sourceSide);
  result = result * healingMultiplier(state);
  return Math.max(0, Math.round(result));
}

function executeEffect(e: Effect, ec: EffectContext): void {
  const { state, ctx, sourceSide } = ec;
  const sourceState = getSide(state, sourceSide);

  switch (e.kind) {
    case "damage": {
      const targets = resolveTargets(state, e.target, sourceSide);
      const baseAmount = evalAmount(e.amount, sourceState, state);
      let totalDealt = 0;

      for (const tg of targets) {
        if (isBlockedSingleTarget(e.target, tg, ec, e.ignoreGuard === true)) continue;
        let amount = applyDamageMultipliers(baseAmount, ec);
        if (tg.kind === "hero" && tg.hero) {
          const prevHp = tg.hero.hp;
          const r = applyHeroDamage(tg.hero, amount, {
            ignoreDef: e.ignoreDef,
            finalMultiplier: getFullGaugeHeroDamageTakenMultiplier(state, ctx, tg.side),
          });
          totalDealt += r.finalAmount;
          // 觸發英雄受傷量表（血怒）
          const tgHeroDef = ctx.getHero(tg.hero.defId);
          const tgRace = ctx.getRace(tgHeroDef.raceId);
          if (tgHeroDef.gauge.onHeroDamaged) {
            gaugeOnHeroDamaged(tg.hero, tgRace.gauge.max, tgHeroDef.gauge.onHeroDamaged, prevHp, tg.hero.hp);
            syncFullGaugeBuffs(state, ctx);
          }
          state.log.push({ turn: state.turn, side: sourceSide, kind: "DAMAGE_HERO", text: `${tg.side === "player" ? "玩家" : "敵方"}英雄受到 ${r.finalAmount} 傷害`, payload: { side: tg.side, amount: r.finalAmount } });
        } else if (tg.kind === "troop" && tg.troop) {
          const r = applyTroopDamage(tg.troop, amount, { ignoreDef: e.ignoreDef });
          totalDealt += r.finalAmount;
          state.log.push({ turn: state.turn, side: sourceSide, kind: "DAMAGE_TROOP", text: `${tg.troop.cardId} 受到 ${r.finalAmount} 傷害`, payload: { instanceId: tg.troop.instanceId, amount: r.finalAmount } });
        }
      }

      if (e.lifesteal && totalDealt > 0) {
        applyLifesteal(state, sourceSide, totalDealt, e.lifesteal);
      }

      // 鬥志：行動命中
      if (ec.sourceKind === "action" && totalDealt > 0) {
        addMorale(sourceState.hero, MORALE_ACTION_HIT);
      }

      // 清理死亡兵力（統一在效果結束後清理）
      reapDeadTroops(state, ctx, sourceSide);
      break;
    }
    case "heal": {
      const amount = applyHealMultipliers(evalAmount(e.amount, sourceState, state), ec);
      const targets = resolveTargets(state, e.target, sourceSide);
      for (const tg of targets) {
        if (tg.kind === "hero" && tg.hero) {
          tg.hero.hp = Math.min(tg.hero.maxHp, tg.hero.hp + amount);
          state.log.push({ turn: state.turn, side: sourceSide, kind: "HEAL_HERO", text: `${tg.side === "player" ? "玩家" : "敵方"}英雄回復 ${amount} HP`, payload: { side: tg.side, amount } });
        } else if (tg.kind === "troop" && tg.troop) {
          tg.troop.hp = Math.min(tg.troop.maxHp, tg.troop.hp + amount);
        }
      }
      break;
    }
    case "draw": {
      const r = drawCards(sourceState, e.count, state.rngState);
      state.rngState = r.newRngState;
      state.log.push({ turn: state.turn, side: sourceSide, kind: "DRAW", text: `抽 ${r.drawn} 張牌`, payload: { count: r.drawn } });
      break;
    }
    case "discard": {
      // 隨機棄
      const count = Math.min(e.count, sourceState.hand.length);
      for (let i = 0; i < count; i++) {
        const card = sourceState.hand.shift();
        if (card) sourceState.graveyard.push(card);
      }
      break;
    }
    case "summon": {
      const card = ctx.getCard(e.cardId);
      if (card.type !== "troop") break;
      const summonSide = e.side === "self" ? sourceSide : (e.side === "enemy" ? otherSide(sourceSide) : sourceSide);
      const target = getSide(state, summonSide);
      for (let i = 0; i < e.count; i++) {
        const slotIdx = target.troopSlots.findIndex((s) => s === null);
        if (slotIdx === -1) break;
        const inst = createTroopInstance(state, card as TroopCard);
        target.troopSlots[slotIdx] = inst;
        // 觸發英雄量表 onTroopEnter
        const heroDef = ctx.getHero(target.hero.defId);
        const race = ctx.getRace(heroDef.raceId);
        if (heroDef.gauge.onTroopEnter) addGauge(target.hero, race.gauge.max, heroDef.gauge.onTroopEnter);
        syncFullGaugeBuffs(state, ctx);
        state.log.push({ turn: state.turn, side: summonSide, kind: "SUMMON", text: `召喚 ${card.name}`, payload: { cardId: card.id, instanceId: inst.instanceId } });
        // onPlay 不在召喚時觸發（區分「部署」與「召喚」）
      }
      break;
    }
    case "gauge": {
      const targetSide = e.side === "self" ? sourceSide : e.side === "enemy" ? otherSide(sourceSide) : sourceSide;
      const ts = getSide(state, targetSide);
      const heroDef = ctx.getHero(ts.hero.defId);
      const race = ctx.getRace(heroDef.raceId);
      addGauge(ts.hero, race.gauge.max, e.delta);
      syncFullGaugeBuffs(state, ctx);
      break;
    }
    case "morale": {
      addMorale(sourceState.hero, e.delta);
      break;
    }
    case "mana": {
      if (e.temporary) addTempMana(sourceState, e.delta);
      else sourceState.manaCurrent = Math.max(0, sourceState.manaCurrent + e.delta);
      break;
    }
    case "armor": {
      const targetSide = e.target ? sourceSide : sourceSide;
      const hero = getSide(state, targetSide).hero;
      hero.armor = Math.max(0, hero.armor + e.amount);
      state.log.push({ turn: state.turn, side: sourceSide, kind: "ARMOR", text: `英雄獲得 ${e.amount} 護甲`, payload: { amount: e.amount } });
      break;
    }
    case "buff": {
      const targets = resolveTargets(state, e.target, sourceSide);
      const turns = e.duration.kind === "permanent" ? 9999 : e.duration.kind === "thisTurn" ? 1 : e.duration.count;
      for (const tg of targets) {
        if (isNegativeMod(e.mod) && isBlockedSingleTarget(e.target, tg, ec)) continue;
        if (isNegativeMod(e.mod) && isDebuffImmune(state, tg.side)) {
          state.log.push({ turn: state.turn, side: sourceSide, kind: "DEBUFF_IMMUNE", text: `${tg.side === "player" ? "玩家" : "敵方"}免疫負面狀態` });
          continue;
        }
        const buff = { id: `buff_${state.nextInstanceId++}`, source: ec.sourceCardId ?? "x", mod: e.mod, remainingTurns: turns };
        if (tg.kind === "troop" && tg.troop) {
          tg.troop.buffs.push(buff);
          if (e.mod.atk) tg.troop.atk += e.mod.atk;
          if (e.mod.def) tg.troop.def += e.mod.def;
          if (e.mod.hp) {
            tg.troop.hp += e.mod.hp;
            tg.troop.maxHp += e.mod.hp;
          }
        } else if (tg.kind === "hero" && tg.hero) {
          tg.hero.buffs.push(buff);
          if (e.mod.atk) tg.hero.atk += e.mod.atk;
          if (e.mod.def) tg.hero.def += e.mod.def;
          if (e.mod.hp) {
            tg.hero.hp += e.mod.hp;
            tg.hero.maxHp += e.mod.hp;
          }
        }
      }
      break;
    }
    case "addKeyword": {
      const targets = resolveTargets(state, e.target, sourceSide);
      const turns = e.duration.kind === "permanent" ? 9999 : e.duration.kind === "thisTurn" ? 1 : e.duration.count;
      for (const tg of targets) {
        if (tg.kind === "troop" && tg.troop) {
          tg.troop.keywords.add(e.keyword);
          tg.troop.keywordBuffs ??= [];
          tg.troop.keywordBuffs.push({
            id: `kw_${state.nextInstanceId++}`,
            source: ec.sourceCardId ?? "x",
            keyword: e.keyword,
            remainingTurns: turns,
          });
        }
      }
      break;
    }
    case "addStatus": {
      const targets = resolveTargets(state, e.target, sourceSide);
      const turns = e.duration.kind === "permanent" ? 9999 : e.duration.kind === "thisTurn" ? 1 : e.duration.count;
      for (const tg of targets) {
        const hostileStatus = isNegativeStatus(e.status) && tg.side !== sourceSide;
        if (hostileStatus && isBlockedSingleTarget(e.target, tg, ec)) continue;
        if (hostileStatus && isDebuffImmune(state, tg.side)) {
          state.log.push({ turn: state.turn, side: sourceSide, kind: "DEBUFF_IMMUNE", text: `${tg.side === "player" ? "?拙振" : "?菜"}?${e.status}` });
          continue;
        }
        const buff = {
          id: `status_${state.nextInstanceId++}`,
          source: ec.sourceCardId ?? "x",
          status: e.status,
          remainingTurns: turns,
        };
        if (tg.kind === "troop" && tg.troop) {
          tg.troop.statusBuffs ??= [];
          tg.troop.statusBuffs.push(buff);
        } else if (tg.kind === "hero" && tg.hero) {
          tg.hero.statusBuffs ??= [];
          tg.hero.statusBuffs.push(buff);
        }
      }
      break;
    }
    case "freeze": {
      const targets = resolveTargets(state, e.target, sourceSide);
      const displayName = e.displayName;
      const displayText = effectDisplayText("凍結", displayName);
      for (const tg of targets) {
        if (isBlockedSingleTarget(e.target, tg, ec)) continue;
        if (isDebuffImmune(state, tg.side)) {
          state.log.push({ turn: state.turn, side: sourceSide, kind: "DEBUFF_IMMUNE", text: `${tg.side === "player" ? "玩家" : "敵方"}免疫${displayText}` });
          continue;
        }
        if (tg.kind === "troop" && tg.troop) {
          const prev = tg.troop.frozenTurns;
          tg.troop.frozenTurns = Math.max(prev, e.turns);
          if (e.turns >= prev) {
            if (displayName) tg.troop.frozenDisplayName = displayName;
            else delete tg.troop.frozenDisplayName;
          }
        }
      }
      break;
    }
    case "freezeHeroAbility": {
      const displayName = e.displayName ?? "封鎖";
      const targetSides = resolveTargetSides(sourceSide, e.side ?? "enemy");
      for (const targetSide of targetSides) {
        if (isDebuffImmune(state, targetSide)) {
          state.log.push({ turn: state.turn, side: sourceSide, kind: "DEBUFF_IMMUNE", text: `${targetSide === "player" ? "玩家" : "敵方"}免疫英雄能力凍結-${displayName}` });
          continue;
        }
        const hero = getSide(state, targetSide).hero;
        addHeroAbilityFreeze(hero, e.modes, e.turns, displayName);
        state.log.push({
          turn: state.turn,
          side: sourceSide,
          kind: "HERO_ABILITY_FREEZE",
          text: `${targetSide === "player" ? "玩家" : "敵方"}英雄能力凍結-${displayName} ${e.turns} 回合：${e.modes.map((m) => HERO_ABILITY_FREEZE_LABEL[m]).join("、")}`,
          payload: { targetSide, modes: e.modes, turns: e.turns, displayName },
        });
      }
      break;
    }
    case "stability": {
      const r = applyStabilityDelta(state, e.delta);
      applyCorruptionStageEffects(state, r.stageJustReached);
      state.log.push({ turn: state.turn, side: sourceSide, kind: "STABILITY", text: `次元壁穩定度 ${e.delta > 0 ? "+" : ""}${e.delta} → ${r.newValue}`, payload: { delta: e.delta, newValue: r.newValue } });
      // v3.3：穩定度跌破 50 時開啟次元滲透裂縫（不可逆，至多 1 個）
      openRiftIfNeeded(state);
      break;
    }
    case "destroyField": {
      state.field = null;
      state.log.push({ turn: state.turn, side: sourceSide, kind: "FIELD_DESTROY", text: "場地摧毀" });
      break;
    }
    case "search": {
      // MVP：簡化版本 — 從牌庫頂往下找符合 type 的第一張，加入手牌
      const idx = e.predicate.type
        ? sourceState.deck.findIndex((c) => ctx.getCard(c.cardId).type === e.predicate.type)
        : 0;
      if (idx >= 0 && sourceState.hand.length < 9) {
        const [picked] = sourceState.deck.splice(idx, 1);
        if (picked) sourceState.hand.push(picked);
      }
      break;
    }
    case "scripted": {
      // M3+ 由獨立腳本處理器接管
      executeScripted(e.tag, e.payload, ec);
      break;
    }
  }
}

function resolveTargetSides(sourceSide: Side, targetSide: TargetSide): Side[] {
  switch (targetSide) {
    case "player": return ["player"];
    case "enemy": return [otherSide(sourceSide)];
    case "self": return [sourceSide];
    case "all": return ["player", "enemy"];
  }
}

/**
 * 清掃死亡兵力，觸發 onDestroy 與相關量表/鬥志事件。
 * 反覆執行直到沒有死亡兵力為止（可能 onDestroy 又造傷）。
 */
export function reapDeadTroops(state: BattleState, ctx: BattleContext, sourceSide: Side, depth = 0): void {
  if (depth > 8) return; // 防止無限遞迴
  let removed = false;
  for (const side of ["player", "enemy"] as const) {
    const s = getSide(state, side);
    for (let i = 0; i < s.troopSlots.length; i++) {
      const t = s.troopSlots[i];
      if (t && t.hp <= 0) {
        s.troopSlots[i] = null;
        s.graveyard.push({ instanceId: t.instanceId, cardId: t.cardId });
        removed = true;
        reapHandleDeath(state, ctx, side, sourceSide, t);
      }
    }
  }
  // v3.3：rift occupant 陣亡時觸發 onDestroy / 鬥志 / vacate（occupant 不在 troopSlots 內，需獨立處理）
  if (state.rift && state.rift.occupant && state.rift.occupant.hp <= 0) {
    const occupant = state.rift.occupant;
    const occupantSide: Side = state.rift.holder === "player" ? "player" : "enemy";
    reapHandleDeath(state, ctx, occupantSide, sourceSide, occupant);
    vacateRiftIfOccupantDead(state);
    removed = true;
  }
  if (removed) reapDeadTroops(state, ctx, sourceSide, depth + 1);
}

/**
 * 處理單一兵力陣亡的副作用：謝幕曲、鬥志、量表、日誌。
 * 抽出來讓 troopSlots 陣亡與 rift occupant 陣亡共用。
 */
function reapHandleDeath(state: BattleState, ctx: BattleContext, side: Side, sourceSide: Side, t: TroopInstance): void {
  const s = getSide(state, side);
  // 觸發謝幕曲
  const card = ctx.getCard(t.cardId);
  if (card.type === "troop" && card.onDestroy) {
    executeEffects(card.onDestroy, { state, ctx, sourceSide: side, sourceKind: "troop_destroy", sourceInstanceId: t.instanceId, sourceCardId: t.cardId });
  }
  // 鬥志：擊殺者鬥志（若 sourceSide 是對立方）
  if (side !== sourceSide) {
    // v3.3：擊殺敵方滲透體 → +10（與一般 +15 互斥）
    const killReward = t.fromRift === true ? MORALE_KILL_RIFT_INFILTRATOR : MORALE_KILL_TROOP;
    addMorale(getSide(state, sourceSide).hero, killReward);
    maybeHealHeroFromFullGaugeTroopKill(state, ctx, sourceSide);
  } else {
    // 我方兵力被殺：自己的鬥志 +5
    addMorale(getSide(state, side).hero, MORALE_ALLY_TROOP_DESTROYED);
  }
  // 量表：自家被殺
  const heroDef = ctx.getHero(s.hero.defId);
  const race = ctx.getRace(heroDef.raceId);
  if (heroDef.gauge.onTroopDestroyedSelf) addGauge(s.hero, race.gauge.max, heroDef.gauge.onTroopDestroyedSelf);
  syncFullGaugeBuffs(state, ctx);
  state.log.push({ turn: state.turn, side: sourceSide, kind: "TROOP_DESTROYED", text: `${card.name} 被摧毀`, payload: { instanceId: t.instanceId, cardId: t.cardId, side, fromRift: t.fromRift === true } });
  // 腐化神殿：每個兵力死亡累積獻祭計數（不分陣營）
  if (state.enemy.hero.defId === "corrupted_temple") {
    const prev = (state.enemy.hero.flags.sacrificeCount as number | undefined) ?? 0;
    state.enemy.hero.flags.sacrificeCount = prev + 1;
  }
}

const SCRIPTED_HANDLERS: Record<string, (payload: unknown, ec: EffectContext) => void> = {};

export function registerScripted(tag: string, fn: (payload: unknown, ec: EffectContext) => void): void {
  SCRIPTED_HANDLERS[tag] = fn;
}

function executeScripted(tag: string, payload: unknown, ec: EffectContext): void {
  const handler = SCRIPTED_HANDLERS[tag];
  if (!handler) {
    ec.state.log.push({ turn: ec.state.turn, side: ec.sourceSide, kind: "SCRIPTED_MISSING", text: `腳本效果未實作：${tag}` });
    return;
  }
  handler(payload, ec);
}

function isNegativeMod(mod: { hp?: number; atk?: number; def?: number; cmd?: number }): boolean {
  return [mod.hp, mod.atk, mod.def, mod.cmd].some((value) => value !== undefined && value < 0);
}

function isNegativeStatus(status: UnitStatus): boolean {
  return status === "marked" || status === "untargetable";
}

function isBlockedSingleTarget(target: TargetSelector, tg: { kind: "hero" | "troop"; side: Side; troop?: TroopInstance }, ec: EffectContext, ignoreGuard = false): boolean {
  if (target.kind !== "single" || tg.side === ec.sourceSide) return false;
  const check = canActionTarget(ec.state, ec.sourceSide, tg.kind === "hero" ? "hero" : tg.troop!, ignoreGuard);
  return !check.ok;
}

function isDebuffImmune(state: BattleState, side: Side): boolean {
  const untilTurn = getSide(state, side).hero.flags.oathDebuffImmuneUntilTurn;
  return typeof untilTurn === "number" && state.turn <= untilTurn;
}

function effectDisplayText(family: string, displayName: string | undefined): string {
  return displayName ? `${family}-${displayName}` : family;
}
