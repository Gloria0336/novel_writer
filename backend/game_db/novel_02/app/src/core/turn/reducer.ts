import type { BattleState, TroopInstance } from "../types/battle";
import type { Side } from "../types/effect";
import type { BattleContext } from "../types/context";
import type { GameAction, OathChoice } from "./actions";
import type { Card } from "../types/card";
import { executeEffects, reapDeadTroops, type EffectContext } from "../effects/registry";
import { canActionTarget, canTroopAttack, troopVsHero, troopVsTroop, type TroopAttackResult } from "../combat/attack";
import { applyHeroDamage } from "../combat/damage";
import { canAffordMana, spendMana } from "../resource/mana";
import { addMorale, canAffordMorale, MORALE_ACTION_HIT, MORALE_KILL_TROOP, spendMorale } from "../resource/morale";
import { addGauge, gaugeOnEquipmentPlay, gaugeOnSpellCast } from "../resource/gauge";
import { applyCorruptionStageEffects, applyStabilityDelta } from "../resource/stability";
import { aliveTroops, freeSlotIndex, getSide, otherSide } from "../selectors/battle";
import { advanceToNextSide, checkVictory, endTurnFor, startTurnFor } from "./phases";
import { createTroopInstance } from "./factories";
import { addTempMana } from "../resource/mana";
import { findTroopBySide } from "../selectors/battle";

export interface ApplyResult {
  ok: boolean;
  reason?: string;
}

/**
 * 套用一個玩家動作（突變 state）。
 * 不可變化的呼叫者請自行 deep-clone state。
 */
export function applyAction(state: BattleState, action: GameAction, ctx: BattleContext): ApplyResult {
  if (state.result !== "ongoing") return { ok: false, reason: "battle ended" };

  const sideKey: Side = state.activeSide;
  const side = getSide(state, sideKey);

  switch (action.type) {
    case "PLAY_TROOP": return playTroop(state, sideKey, side, action.handIndex, action.slotIndex, ctx);
    case "PLAY_SPELL": return playSpell(state, sideKey, side, action.handIndex, action.targetInstanceId, ctx, action.oathChoice);
    case "PLAY_ACTION": return playActionCard(state, sideKey, side, action.handIndex, action.targetInstanceId, ctx);
    case "PLAY_EQUIPMENT": return playEquipment(state, sideKey, side, action.handIndex, ctx);
    case "PLAY_FIELD": return playField(state, sideKey, side, action.handIndex, ctx);
    case "TROOP_ATTACK": return troopAttack(state, sideKey, action.attackerInstanceId, action.targetInstanceId, ctx);
    case "USE_SKILL": return useSkill(state, sideKey, side, action.skillId, action.targetInstanceId, ctx);
    case "USE_ULTIMATE": return useUltimate(state, sideKey, side, action.targetInstanceId, ctx);
    case "END_TURN": return endTurn(state, sideKey, ctx);
  }
}

function lookupCard(side: BattleState["player"], handIndex: number, ctx: BattleContext): { card: Card; instanceId: string } | null {
  const inst = side.hand[handIndex];
  if (!inst) return null;
  return { card: ctx.getCard(inst.cardId), instanceId: inst.instanceId };
}

function discardFromHand(side: BattleState["player"], handIndex: number): void {
  const [removed] = side.hand.splice(handIndex, 1);
  if (removed) side.graveyard.push(removed);
}

function playTroop(state: BattleState, sideKey: Side, side: BattleState["player"], handIndex: number, slotIndex: number, ctx: BattleContext): ApplyResult {
  const lookup = lookupCard(side, handIndex, ctx);
  if (!lookup) return { ok: false, reason: "invalid hand index" };
  if (lookup.card.type !== "troop") return { ok: false, reason: "not a troop card" };
  if (slotIndex < 0 || slotIndex >= side.troopSlots.length) return { ok: false, reason: "invalid slot" };
  if (side.troopSlots[slotIndex] !== null) return { ok: false, reason: "slot occupied" };
  if (!canAffordMana(side, lookup.card.cost)) return { ok: false, reason: "not enough mana" };

  spendMana(side, lookup.card.cost);
  discardFromHand(side, handIndex);

  const inst = createTroopInstance(state, lookup.card);
  side.troopSlots[slotIndex] = inst;
  state.log.push({ turn: state.turn, side: sideKey, kind: "PLAY_TROOP", text: `部署 ${lookup.card.name}`, payload: { cardId: lookup.card.id, instanceId: inst.instanceId, slotIndex } });

  // 種族量表：onTroopEnter
  const heroDef = ctx.getHero(side.hero.defId);
  const race = ctx.getRace(heroDef.raceId);
  if (heroDef.gauge.onTroopEnter) addGauge(side.hero, race.gauge.max, heroDef.gauge.onTroopEnter);

  // 入場曲
  if (lookup.card.onPlay) {
    executeEffects(lookup.card.onPlay, {
      state, ctx, sourceSide: sideKey, sourceKind: "troop_play", sourceInstanceId: inst.instanceId, sourceCardId: lookup.card.id,
    });
  }

  reapDeadTroops(state, ctx, sideKey);
  checkVictory(state);
  return { ok: true };
}

function playSpell(state: BattleState, sideKey: Side, side: BattleState["player"], handIndex: number, targetInstanceId: string | undefined, ctx: BattleContext, oathChoice?: OathChoice): ApplyResult {
  const lookup = lookupCard(side, handIndex, ctx);
  if (!lookup) return { ok: false, reason: "invalid hand index" };
  if (lookup.card.type !== "spell") return { ok: false, reason: "not a spell card" };

  // 共鳴量表：法術費用是否在「詠唱完成」狀態（>= 4 stacks）需減免？我們在 spec 用 hero gaugeValue
  const heroDef = ctx.getHero(side.hero.defId);
  const race = ctx.getRace(heroDef.raceId);
  let cost = lookup.card.cost;
  if (race.gauge.id === "resonance" && side.hero.gaugeValue >= 4) {
    cost = 0;
    side.hero.gaugeValue = 0;
  }
  if (!canAffordMana(side, cost)) return { ok: false, reason: "not enough mana" };

  spendMana(side, cost);
  discardFromHand(side, handIndex);

  // 法術連鎖：超載職業的臨時魔力獎勵
  side.spellsCastThisTurn++;
  side.spellsCastThisGame++;
  const cls = ctx.getClass(heroDef.classId);
  if (cls.keyword === "overload" && side.spellsCastThisTurn >= 3) {
    addTempMana(side, 1);
    state.log.push({ turn: state.turn, side: sideKey, kind: "OVERLOAD", text: "超載：本回合 +1 臨時魔力" });
  }

  // 共鳴量表 onSpellCast
  if (heroDef.gauge.onSpellCast) gaugeOnSpellCast(side.hero, race.gauge.max, heroDef.gauge);

  state.log.push({ turn: state.turn, side: sideKey, kind: "PLAY_SPELL", text: `施放 ${lookup.card.name}`, payload: { cardId: lookup.card.id } });

  const ec: EffectContext = { state, ctx, sourceSide: sideKey, sourceKind: "spell", sourceCardId: lookup.card.id };
  // 把 single 目標的 pickedInstanceId 注入
  const effects = lookup.card.effects
    .map((e) => maybeInjectOathChoice(e, oathChoice))
    .map((e) => maybeInjectTarget(e, targetInstanceId));
  executeEffects(effects, ec);

  reapDeadTroops(state, ctx, sideKey);
  checkVictory(state);
  return { ok: true };
}

function maybeInjectOathChoice<T>(e: T, choice: OathChoice | undefined): T {
  if (!choice) return e;
  const eff = e as unknown as { kind?: string; tag?: string; payload?: unknown };
  if (eff.kind === "scripted" && eff.tag === "OATH_CHOICE") {
    return { ...(e as object), payload: { choice } } as T;
  }
  return e;
}

function maybeInjectTarget<T>(e: T, instanceId: string | undefined): T {
  if (!instanceId) return e;
  const eff = e as unknown as { target?: { kind?: string; pickedInstanceId?: string } };
  if (eff.target && eff.target.kind === "single" && !eff.target.pickedInstanceId) {
    return { ...(e as object), target: { ...eff.target, pickedInstanceId: instanceId } } as T;
  }
  return e;
}

function playActionCard(state: BattleState, sideKey: Side, side: BattleState["player"], handIndex: number, targetInstanceId: string | undefined, ctx: BattleContext): ApplyResult {
  const lookup = lookupCard(side, handIndex, ctx);
  if (!lookup) return { ok: false, reason: "invalid hand index" };
  if (lookup.card.type !== "action") return { ok: false, reason: "not an action card" };
  if (!canAffordMana(side, lookup.card.cost)) return { ok: false, reason: "not enough mana" };

  // 守護優先檢查（若效果有 single 目標且未 ignoreGuard）
  if (targetInstanceId) {
    for (const e of lookup.card.effects) {
      if ("target" in e && e.target && (e.target as { kind?: string }).kind === "single") {
        const ignoreGuard = "ignoreGuard" in e && (e as { ignoreGuard?: boolean }).ignoreGuard === true;
        const targetEntity = findTargetByInstanceId(state, targetInstanceId);
        if (targetEntity) {
          const check = canActionTarget(state, sideKey, targetEntity, ignoreGuard);
          if (!check.ok) return { ok: false, reason: check.reason };
        }
      }
    }
  }

  spendMana(side, lookup.card.cost);
  discardFromHand(side, handIndex);
  state.log.push({ turn: state.turn, side: sideKey, kind: "PLAY_ACTION", text: `使用 ${lookup.card.name}`, payload: { cardId: lookup.card.id, targetInstanceId } });

  const effects = lookup.card.effects.map((e) => maybeInjectTarget(e, targetInstanceId));
  executeEffects(effects, { state, ctx, sourceSide: sideKey, sourceKind: "action", sourceCardId: lookup.card.id });

  if (lookup.card.postEffects) {
    executeEffects(lookup.card.postEffects, { state, ctx, sourceSide: sideKey, sourceKind: "action", sourceCardId: lookup.card.id });
  }

  reapDeadTroops(state, ctx, sideKey);
  checkVictory(state);
  return { ok: true };
}

function findTargetByInstanceId(state: BattleState, instanceId: string): TroopInstance | "hero" | null {
  if (instanceId === "H_player" || instanceId === "H_enemy") return "hero";
  const f = findTroopBySide(state, instanceId);
  return f ? f.troop : null;
}

function playEquipment(state: BattleState, sideKey: Side, side: BattleState["player"], handIndex: number, ctx: BattleContext): ApplyResult {
  const lookup = lookupCard(side, handIndex, ctx);
  if (!lookup) return { ok: false, reason: "invalid hand index" };
  if (lookup.card.type !== "equipment") return { ok: false, reason: "not equipment" };
  if (!canAffordMana(side, lookup.card.cost)) return { ok: false, reason: "not enough mana" };

  spendMana(side, lookup.card.cost);
  discardFromHand(side, handIndex);

  // 替換舊裝備（移除舊修正）— MVP：只追蹤 cardId，不還原修正（簡化）
  const slot = lookup.card.slot;
  side.hero.equipment[slot] = lookup.card.id;
  // 套用修正
  if (lookup.card.modifiers.atk) side.hero.atk += lookup.card.modifiers.atk;
  if (lookup.card.modifiers.def) side.hero.def += lookup.card.modifiers.def;
  if (lookup.card.modifiers.hp) {
    side.hero.hp = Math.min(side.hero.maxHp + lookup.card.modifiers.hp, side.hero.hp + lookup.card.modifiers.hp);
    side.hero.maxHp += lookup.card.modifiers.hp;
  }
  if (lookup.card.modifiers.cmd) side.hero.cmd += lookup.card.modifiers.cmd;

  state.log.push({ turn: state.turn, side: sideKey, kind: "PLAY_EQUIPMENT", text: `裝備 ${lookup.card.name}` });

  // 量表 onEquipmentPlay
  const heroDef = ctx.getHero(side.hero.defId);
  const race = ctx.getRace(heroDef.raceId);
  if (heroDef.gauge.onEquipmentPlay) gaugeOnEquipmentPlay(side.hero, race.gauge.max, heroDef.gauge);

  if (lookup.card.onPlay) {
    executeEffects(lookup.card.onPlay, { state, ctx, sourceSide: sideKey, sourceKind: "equipment", sourceCardId: lookup.card.id });
  }
  return { ok: true };
}

function playField(state: BattleState, sideKey: Side, side: BattleState["player"], handIndex: number, ctx: BattleContext): ApplyResult {
  const lookup = lookupCard(side, handIndex, ctx);
  if (!lookup) return { ok: false, reason: "invalid hand index" };
  if (lookup.card.type !== "field") return { ok: false, reason: "not a field" };
  if (!canAffordMana(side, lookup.card.cost)) return { ok: false, reason: "not enough mana" };

  spendMana(side, lookup.card.cost);
  discardFromHand(side, handIndex);

  state.field = { cardId: lookup.card.id, ownerSide: sideKey };
  state.log.push({ turn: state.turn, side: sideKey, kind: "PLAY_FIELD", text: `放置場地 ${lookup.card.name}` });

  if (lookup.card.effects.length > 0) {
    executeEffects(lookup.card.effects, { state, ctx, sourceSide: sideKey, sourceKind: "field", sourceCardId: lookup.card.id });
  }
  return { ok: true };
}

function troopAttack(state: BattleState, sideKey: Side, attackerId: string, targetId: string, ctx: BattleContext): ApplyResult {
  const attacker = findTroopBySide(state, attackerId);
  if (!attacker || attacker.side !== sideKey) return { ok: false, reason: "invalid attacker" };

  let targetEntity: TroopInstance | "hero";
  let targetSide: Side;
  let targetSlotIndex: number | undefined;
  if (targetId === "H_player" || targetId === "H_enemy") targetEntity = "hero";
  else {
    const t = findTroopBySide(state, targetId);
    if (!t || t.side === sideKey) return { ok: false, reason: "invalid target" };
    targetEntity = t.troop;
    targetSide = t.side;
    targetSlotIndex = t.slotIndex;
  }
  targetSide = targetId === "H_player" ? "player" : targetId === "H_enemy" ? "enemy" : targetSide!;

  const check = canTroopAttack(state, sideKey, attacker.troop, targetEntity);
  if (!check.ok) return { ok: false, reason: check.reason };

  const attackVisualPayload = {
    attackerSide: attacker.side,
    attackerSlotIndex: attacker.slotIndex,
    attackerSlotCount: getSide(state, attacker.side).troopSlots.length,
    attackerCardId: attacker.troop.cardId,
    targetSide,
    targetKind: targetEntity === "hero" ? "hero" : "troop",
    targetSlotIndex,
    targetSlotCount: getSide(state, targetSide).troopSlots.length,
    targetCardId: targetEntity === "hero" ? undefined : targetEntity.cardId,
    targetHeroId: targetEntity === "hero" ? targetId : undefined,
  };
  let attackResult: TroopAttackResult;
  if (targetEntity === "hero") {
    attackResult = troopVsHero(state, attacker.troop, sideKey);
  } else {
    attackResult = troopVsTroop(attacker.troop, targetEntity);
    // 汲取
    if (attacker.troop.keywords.has("lifesteal")) {
      // 兵力汲取由 troop 自身回血（這裡不實作 troop heal）
    }
  }
  for (const log of attackResult.log) {
    state.log.push({
      turn: state.turn,
      side: sideKey,
      kind: log.kind,
      text: log.text,
      payload: { ...log.payload, ...attackVisualPayload },
    });
  }

  reapDeadTroops(state, ctx, sideKey);
  checkVictory(state);
  return { ok: true };
}

function useSkill(state: BattleState, sideKey: Side, side: BattleState["player"], skillId: string, targetInstanceId: string | undefined, ctx: BattleContext): ApplyResult {
  const heroDef = ctx.getHero(side.hero.defId);
  const skill = heroDef.actives.find((s) => s.id === skillId);
  if (!skill) return { ok: false, reason: "skill not found" };

  if (skill.cost.morale && !canAffordMorale(side.hero, skill.cost.morale)) return { ok: false, reason: "not enough morale" };
  if (skill.cost.mana && !canAffordMana(side, skill.cost.mana)) return { ok: false, reason: "not enough mana" };
  if (skill.cost.gauge && side.hero.gaugeValue < skill.cost.gauge) return { ok: false, reason: "not enough gauge" };

  if (skill.cost.morale) spendMorale(side.hero, skill.cost.morale);
  if (skill.cost.mana) spendMana(side, skill.cost.mana);
  if (skill.cost.gauge) side.hero.gaugeValue -= skill.cost.gauge;

  state.log.push({ turn: state.turn, side: sideKey, kind: "USE_SKILL", text: `${heroDef.name} 使用 ${skill.name}`, payload: { skillId } });

  const effects = skill.effects.map((e) => maybeInjectTarget(e, targetInstanceId));
  executeEffects(effects, { state, ctx, sourceSide: sideKey, sourceKind: "skill", sourceCardId: skill.id });

  reapDeadTroops(state, ctx, sideKey);
  checkVictory(state);
  return { ok: true };
}

function useUltimate(state: BattleState, sideKey: Side, side: BattleState["player"], targetInstanceId: string | undefined, ctx: BattleContext): ApplyResult {
  const heroDef = ctx.getHero(side.hero.defId);
  const ult = heroDef.ultimate;
  if (side.hero.flags.ultimateUsed) return { ok: false, reason: "ultimate already used" };
  if (ult.cost.morale && !canAffordMorale(side.hero, ult.cost.morale)) return { ok: false, reason: "not enough morale" };

  if (ult.cost.morale) spendMorale(side.hero, ult.cost.morale);
  side.hero.flags.ultimateUsed = true;

  state.log.push({ turn: state.turn, side: sideKey, kind: "USE_ULTIMATE", text: `${heroDef.name} 施放終極技 ${ult.name}！` });

  const effects = ult.effects.map((e) => maybeInjectTarget(e, targetInstanceId));
  executeEffects(effects, { state, ctx, sourceSide: sideKey, sourceKind: "ultimate", sourceCardId: ult.id });

  reapDeadTroops(state, ctx, sideKey);
  checkVictory(state);
  return { ok: true };
}

function endTurn(state: BattleState, sideKey: Side, ctx: BattleContext): ApplyResult {
  endTurnFor(state, sideKey);
  advanceToNextSide(state);
  startTurnFor(state, state.activeSide, ctx);
  checkVictory(state);
  return { ok: true };
}
