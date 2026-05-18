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
import { tryPlayerOccupy } from "../resource/rift";
import { aliveTroops, freeSlotIndex, getSide, otherSide } from "../selectors/battle";
import { advanceToNextSide, checkVictory, endTurnFor, startTurnFor } from "./phases";
import { createTroopInstance } from "./factories";
import { addTempMana } from "../resource/mana";
import { findTroopBySide } from "../selectors/battle";
import { isHeroAbilityFrozen } from "../effects/heroAbilityFreeze";
import { getEffectiveCardCost, syncFullGaugeBuffs } from "../resource/fullGaugeBuff";
import { spendGauge } from "../resource/gauge";

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

  let result: ApplyResult;
  switch (action.type) {
    case "PLAY_TROOP": result = playTroop(state, sideKey, side, action.handIndex, action.slotIndex, ctx); break;
    case "PLAY_TROOP_RIFT": result = playTroopRift(state, sideKey, side, action.handIndex, ctx); break;
    case "PLAY_SPELL": result = playSpell(state, sideKey, side, action.handIndex, action.targetInstanceId, ctx, action.oathChoice, action.riftHandIndex); break;
    case "PLAY_ACTION": result = playActionCard(state, sideKey, side, action.handIndex, action.targetInstanceId, ctx); break;
    case "PLAY_EQUIPMENT": result = playEquipment(state, sideKey, side, action.handIndex, ctx); break;
    case "PLAY_FIELD": result = playField(state, sideKey, side, action.handIndex, ctx); break;
    case "TROOP_ATTACK": result = troopAttack(state, sideKey, action.attackerInstanceId, action.targetInstanceId, ctx); break;
    case "USE_SKILL": result = useSkill(state, sideKey, side, action.skillId, action.targetInstanceId, ctx); break;
    case "USE_ULTIMATE": result = useUltimate(state, sideKey, side, action.targetInstanceId, ctx); break;
    case "END_TURN": result = endTurn(state, sideKey, ctx); break;
  }
  if (result.ok) syncFullGaugeBuffs(state, ctx);
  return result;
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
  if (isHeroAbilityFrozen(side.hero, "troop")) return { ok: false, reason: "troop cards frozen" };
  if (slotIndex < 0 || slotIndex >= side.troopSlots.length) return { ok: false, reason: "invalid slot" };
  if (side.troopSlots[slotIndex] !== null) return { ok: false, reason: "slot occupied" };
  const cost = getEffectiveCardCost(state, ctx, sideKey, lookup.card);
  if (!canAffordMana(side, cost)) return { ok: false, reason: "not enough mana" };

  spendMana(side, cost);
  discardFromHand(side, handIndex);

  const inst = createTroopInstance(state, lookup.card);
  side.troopSlots[slotIndex] = inst;
  state.log.push({ turn: state.turn, side: sideKey, kind: "PLAY_TROOP", text: `部署 ${lookup.card.name}`, payload: { cardId: lookup.card.id, instanceId: inst.instanceId, slotIndex } });

  // 種族量表：onTroopEnter
  const heroDef = ctx.getHero(side.hero.defId);
  const race = ctx.getRace(heroDef.raceId);
  if (heroDef.gauge.onTroopEnter) addGauge(side.hero, race.gauge.max, heroDef.gauge.onTroopEnter);
  syncFullGaugeBuffs(state, ctx);

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

function playTroopRift(state: BattleState, sideKey: Side, side: BattleState["player"], handIndex: number, ctx: BattleContext): ApplyResult {
  // v3.3：玩家主動部署兵力到次元滲透裂縫位（取代一般兵力欄）
  const lookup = lookupCard(side, handIndex, ctx);
  if (!lookup) return { ok: false, reason: "invalid hand index" };
  if (lookup.card.type !== "troop") return { ok: false, reason: "not a troop card" };
  if (isHeroAbilityFrozen(side.hero, "troop")) return { ok: false, reason: "troop cards frozen" };
  if (!state.rift) return { ok: false, reason: "no rift open" };
  if (state.rift.holder !== "open") return { ok: false, reason: "rift not open (occupied)" };
  const cost = getEffectiveCardCost(state, ctx, sideKey, lookup.card);
  if (!canAffordMana(side, cost)) return { ok: false, reason: "not enough mana" };

  spendMana(side, cost);
  discardFromHand(side, handIndex);

  const inst = createTroopInstance(state, lookup.card);
  const occupied = tryPlayerOccupy(state, inst);
  if (!occupied) {
    // 理論不應到這（前置已檢查）；防禦性 log
    state.log.push({ turn: state.turn, side: sideKey, kind: "PLAY_TROOP_RIFT_FAIL", text: "佔據裂縫失敗" });
    return { ok: false, reason: "occupy failed" };
  }

  state.log.push({ turn: state.turn, side: sideKey, kind: "PLAY_TROOP_RIFT", text: `部署 ${lookup.card.name} 到次元裂縫`, payload: { cardId: lookup.card.id, instanceId: inst.instanceId } });

  // 種族量表：onTroopEnter（佔據裂縫仍視為兵力入場）
  const heroDef = ctx.getHero(side.hero.defId);
  const race = ctx.getRace(heroDef.raceId);
  if (heroDef.gauge.onTroopEnter) addGauge(side.hero, race.gauge.max, heroDef.gauge.onTroopEnter);
  syncFullGaugeBuffs(state, ctx);

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

function playSpell(state: BattleState, sideKey: Side, side: BattleState["player"], handIndex: number, targetInstanceId: string | undefined, ctx: BattleContext, oathChoice?: OathChoice, riftHandIndex?: number): ApplyResult {
  const lookup = lookupCard(side, handIndex, ctx);
  if (!lookup) return { ok: false, reason: "invalid hand index" };
  if (lookup.card.type !== "spell") return { ok: false, reason: "not a spell card" };
  if (isHeroAbilityFrozen(side.hero, "spell")) return { ok: false, reason: "spell cards frozen" };

  // v3.3：S15 / S16 條件檢查（在付費前 reject）
  let riftCardInstanceId: string | undefined;
  if (lookup.card.id === "S15") {
    if (!state.rift || state.rift.holder !== "open") return { ok: false, reason: "S15 requires open rift" };
    if (state.rift.s15UsesPlayer >= 3) return { ok: false, reason: "S15 per-battle limit reached" };
    if (riftHandIndex === undefined || riftHandIndex < 0 || riftHandIndex >= side.hand.length) return { ok: false, reason: "S15 requires riftHandIndex" };
    if (riftHandIndex === handIndex) return { ok: false, reason: "S15 cannot target itself" };
    const target = side.hand[riftHandIndex];
    if (!target) return { ok: false, reason: "S15 target hand slot empty" };
    if (ctx.getCard(target.cardId).type !== "troop") return { ok: false, reason: "S15 target must be a troop" };
    // 在 discardFromHand 之前先記錄 instanceId（之後 hand index 會位移）
    riftCardInstanceId = target.instanceId;
  }
  if (lookup.card.id === "S16") {
    if (!state.rift) return { ok: false, reason: "S16 requires rift on battlefield" };
    if (state.rift.s16UsedPlayer) return { ok: false, reason: "S16 already used this battle" };
  }

  // 共鳴量表：法術費用是否在「詠唱完成」狀態（>= 4 stacks）需減免？我們在 spec 用 hero gaugeValue
  const heroDef = ctx.getHero(side.hero.defId);
  const race = ctx.getRace(heroDef.raceId);
  let cost = getEffectiveCardCost(state, ctx, sideKey, lookup.card);
  if (race.gauge.id === "resonance" && side.hero.gaugeValue >= 4) {
    cost = 0;
    side.hero.gaugeValue = 0;
    syncFullGaugeBuffs(state, ctx);
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
  syncFullGaugeBuffs(state, ctx);

  state.log.push({ turn: state.turn, side: sideKey, kind: "PLAY_SPELL", text: `施放 ${lookup.card.name}`, payload: { cardId: lookup.card.id } });

  const ec: EffectContext = { state, ctx, sourceSide: sideKey, sourceKind: "spell", sourceCardId: lookup.card.id };
  // 把 single 目標的 pickedInstanceId 注入；以及 S15 RIFT_CALL 的 handCardInstanceId
  const effects = lookup.card.effects
    .map((e) => maybeInjectOathChoice(e, oathChoice))
    .map((e) => maybeInjectTarget(e, targetInstanceId))
    .map((e) => maybeInjectRiftHand(e, riftCardInstanceId));
  executeEffects(effects, ec);

  reapDeadTroops(state, ctx, sideKey);
  checkVictory(state);
  return { ok: true };
}

function maybeInjectRiftHand<T>(e: T, riftCardInstanceId: string | undefined): T {
  if (!riftCardInstanceId) return e;
  const eff = e as unknown as { kind?: string; tag?: string; payload?: unknown };
  if (eff.kind === "scripted" && eff.tag === "RIFT_CALL") {
    return { ...(e as object), payload: { handCardInstanceId: riftCardInstanceId } } as T;
  }
  return e;
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
  if (isHeroAbilityFrozen(side.hero, "action")) return { ok: false, reason: "action cards frozen" };
  const cost = getEffectiveCardCost(state, ctx, sideKey, lookup.card);
  if (!canAffordMana(side, cost)) return { ok: false, reason: "not enough mana" };

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

  spendMana(side, cost);
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
  const cost = getEffectiveCardCost(state, ctx, sideKey, lookup.card);
  if (!canAffordMana(side, cost)) return { ok: false, reason: "not enough mana" };

  spendMana(side, cost);
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
  syncFullGaugeBuffs(state, ctx);

  if (lookup.card.onPlay) {
    executeEffects(lookup.card.onPlay, { state, ctx, sourceSide: sideKey, sourceKind: "equipment", sourceCardId: lookup.card.id });
  }
  return { ok: true };
}

function playField(state: BattleState, sideKey: Side, side: BattleState["player"], handIndex: number, ctx: BattleContext): ApplyResult {
  const lookup = lookupCard(side, handIndex, ctx);
  if (!lookup) return { ok: false, reason: "invalid hand index" };
  if (lookup.card.type !== "field") return { ok: false, reason: "not a field" };
  const cost = getEffectiveCardCost(state, ctx, sideKey, lookup.card);
  if (!canAffordMana(side, cost)) return { ok: false, reason: "not enough mana" };
  // v3.3：F08 次元裂縫（重作版）唯有場上已開啟裂縫時可施放
  if (lookup.card.id === "F08" && !state.rift) {
    return { ok: false, reason: "F08 requires open rift" };
  }

  spendMana(side, cost);
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
    attackResult = troopVsHero(state, ctx, attacker.troop, sideKey);
  } else {
    attackResult = troopVsTroop(state, ctx, attacker.troop, sideKey, targetEntity, targetSide);
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
  if (skill.cost.gauge) {
    spendGauge(side.hero, skill.cost.gauge);
    syncFullGaugeBuffs(state, ctx);
  }

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
  endTurnFor(state, sideKey, ctx);
  advanceToNextSide(state);
  startTurnFor(state, state.activeSide, ctx);
  checkVictory(state);
  return { ok: true };
}
