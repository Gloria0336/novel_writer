import type { BattleState, TroopInstance } from "../core/types/battle";
import type { BattleContext } from "../core/types/context";
import type { Card } from "../core/types/card";
import type { Effect, TargetSelector } from "../core/types/effect";
import type { GameAction, OathChoice } from "../core/turn/actions";
import { aliveTroops } from "../core/selectors/battle";
import { canActionTarget, canTroopAttack } from "../core/combat/attack";
import { canAffordMana } from "../core/resource/mana";
import { canAffordMorale } from "../core/resource/morale";
import { isHeroAbilityFrozen } from "../core/effects/heroAbilityFreeze";
import { getEffectiveCardCost } from "../core/resource/fullGaugeBuff";
import { canPlayField } from "../core/effects/omenHooks";

const SCRIPTED_SELF_TROOP_TARGET_CARDS = new Set(["A_h_05"]);
const SCRIPTED_ENEMY_ANY_TARGET_CARDS = new Set(["A_b_02"]);
const OATH_CHOICES: readonly OathChoice[] = ["restore", "strengthen", "purify"];

interface CardLookup {
  handIndex: number;
  cardId: string;
  card: Card;
}

function lookupHand(state: BattleState, ctx: BattleContext): CardLookup[] {
  const out: CardLookup[] = [];
  state.player.hand.forEach((inst, idx) => {
    try {
      out.push({ handIndex: idx, cardId: inst.cardId, card: ctx.getCard(inst.cardId) });
    } catch {
      // unknown card id — skip
    }
  });
  return out;
}

function effectiveCostFor(state: BattleState, ctx: BattleContext, card: Card): number {
  let cost = getEffectiveCardCost(state, ctx, "player", card);
  // 鳴響 (resonance) 量表滿 → spell 免費（沿用 BattleScreen 的 canPlayCardCheck 規則）
  const heroDef = ctx.getHero(state.player.hero.defId);
  const race = ctx.getRace(heroDef.raceId);
  if (card.type === "spell" && race.gauge.id === "resonance" && state.player.hero.gaugeValue >= 4) {
    cost = 0;
  }
  return cost;
}

function canAffordCard(state: BattleState, ctx: BattleContext, card: Card): boolean {
  return canAffordMana(state.player, effectiveCostFor(state, ctx, card));
}

function freeTroopSlots(state: BattleState): number[] {
  const out: number[] = [];
  state.player.troopSlots.forEach((s, i) => {
    if (s === null) out.push(i);
  });
  return out;
}

function cardNeedsTarget(card: Card, state: BattleState): boolean {
  if (card.id === "S_e_07") return state.player.hero.gaugeValue < 4;
  if ((card.type === "spell" || card.type === "action") && SCRIPTED_ENEMY_ANY_TARGET_CARDS.has(card.id)) return true;
  if ((card.type === "spell" || card.type === "action") && SCRIPTED_SELF_TROOP_TARGET_CARDS.has(card.id)) return true;
  if (card.type !== "spell" && card.type !== "action") return false;
  return card.effects.some((e) => "target" in e && (e.target as { kind?: string }).kind === "single");
}

function effectsOf(card: Card): readonly Effect[] {
  if (card.type === "spell" || card.type === "action" || card.type === "field") return card.effects;
  return [];
}

interface TargetCandidate {
  id: string;
  kind: "hero" | "troop";
  side: "player" | "enemy";
}

/**
 * 從玩家視角列舉某效果鏈第一個 single-target 的合法目標。
 * 規則翻譯：filter.side "enemy" = 對方（=敵方）；"self" = 我方（=玩家）；"all" = 雙方。
 */
function enumerateTargetsForEffects(
  state: BattleState,
  effects: readonly Effect[],
  ignoreGuard: boolean,
): TargetCandidate[] {
  for (const e of effects) {
    if (!("target" in e) || !e.target) continue;
    const sel = e.target as TargetSelector;
    if (sel.kind !== "single") continue;
    return collectTargets(state, sel, ignoreGuard);
  }
  return [];
}

function collectTargets(state: BattleState, sel: TargetSelector & { kind: "single" }, ignoreGuard: boolean): TargetCandidate[] {
  const wantHero = !sel.filter.entity || sel.filter.entity === "any" || sel.filter.entity === "hero";
  const wantTroop = !sel.filter.entity || sel.filter.entity === "any" || sel.filter.entity === "troop";
  // 玩家視角：filter.side "enemy" → enemy 方；"self" → player 方；"all" → 雙方
  const wantEnemy = !sel.filter.side || sel.filter.side === "enemy" || sel.filter.side === "all";
  const wantSelf = sel.filter.side === "self" || sel.filter.side === "all";

  const out: TargetCandidate[] = [];
  if (wantHero && wantEnemy && canActionTarget(state, "player", "hero", ignoreGuard).ok) {
    out.push({ id: "H_enemy", kind: "hero", side: "enemy" });
  }
  if (wantHero && wantSelf) {
    out.push({ id: "H_player", kind: "hero", side: "player" });
  }
  if (wantEnemy && wantTroop) {
    for (const t of aliveTroops(state.enemy)) {
      if (canActionTarget(state, "player", t, ignoreGuard).ok) {
        out.push({ id: t.instanceId, kind: "troop", side: "enemy" });
      }
    }
  }
  if (wantSelf && wantTroop) {
    for (const t of aliveTroops(state.player)) {
      out.push({ id: t.instanceId, kind: "troop", side: "player" });
    }
  }
  return out;
}

function effectsIgnoreGuard(effects: readonly Effect[]): boolean {
  return effects.some((e) => "ignoreGuard" in e && (e as { ignoreGuard?: boolean }).ignoreGuard === true);
}

function canPlayCardCheck(state: BattleState, ctx: BattleContext, card: Card): boolean {
  if (state.activeSide !== "player") return false;
  if (card.type === "field" && !canPlayField(state, "player")) return false;
  if (!canAffordCard(state, ctx, card)) return false;
  if (card.type === "troop") {
    const hasFreeSlot = state.player.troopSlots.some((s) => s === null);
    const riftOpen = state.rift?.holder === "open";
    if (!hasFreeSlot && !riftOpen) return false;
  }
  if (card.id === "S_c_15") {
    if (!state.rift || state.rift.holder !== "open") return false;
    if (state.rift.s15UsesPlayer >= 3) return false;
    const hasOtherTroop = state.player.hand.some((h) => {
      if (h.cardId === "S_c_15") return false;
      try {
        return ctx.getCard(h.cardId).type === "troop";
      } catch {
        return false;
      }
    });
    if (!hasOtherTroop) return false;
  }
  if (card.id === "S_c_16") {
    if (!state.rift) return false;
    if (state.rift.s16UsedPlayer) return false;
  }
  if (card.id === "F_c_08") {
    if (!state.rift) return false;
  }
  if (card.id === "A_h_05") {
    const uses = (state.player.hero.flags["frontlineAdvanceUses"] as number | undefined) ?? 0;
    if (state.player.frontlineSlot || uses >= 2) return false;
    if (!state.player.troopSlots.some((t) => t && !t.isConstruct)) return false;
  }
  return true;
}

function findTroopAnywhere(state: BattleState, instanceId: string): { troop: TroopInstance; side: "player" | "enemy" } | null {
  for (const side of ["player", "enemy"] as const) {
    const slots = (side === "player" ? state.player : state.enemy).troopSlots;
    for (const t of slots) if (t && t.instanceId === instanceId) return { troop: t, side };
    const frontline = (side === "player" ? state.player : state.enemy).frontlineSlot;
    if (frontline && frontline.instanceId === instanceId) return { troop: frontline, side };
  }
  return null;
}

function isScriptedSelfTroopTargetCard(card: Card): boolean {
  return card.type === "action" && SCRIPTED_SELF_TROOP_TARGET_CARDS.has(card.id);
}

function isScriptedEnemyAnyTargetCard(card: Card): boolean {
  return card.type === "action" && SCRIPTED_ENEMY_ANY_TARGET_CARDS.has(card.id);
}

function canPlayCardTargetTroop(card: Card, side: "player" | "enemy", troop: TroopInstance, isFrontline: boolean): boolean {
  if (isScriptedSelfTroopTargetCard(card)) return side === "player" && !isFrontline && !troop.isConstruct;
  if (isScriptedEnemyAnyTargetCard(card)) return side === "enemy";
  if (card.id === "S_e_07") return side === "enemy";
  return true;
}

function pushTroopDeployments(out: GameAction[], lookup: CardLookup, freeSlots: number[]): void {
  for (const slotIndex of freeSlots) {
    out.push({ type: "PLAY_TROOP", handIndex: lookup.handIndex, slotIndex });
  }
}

function pushSpellOrAction(out: GameAction[], state: BattleState, lookup: CardLookup): void {
  const { card } = lookup;
  if (card.type !== "spell" && card.type !== "action") return;
  const type: "PLAY_SPELL" | "PLAY_ACTION" = card.type === "spell" ? "PLAY_SPELL" : "PLAY_ACTION";

  // S_c_14 灼誓：必須帶 oathChoice，每種選擇都是一個獨立合法動作
  if (card.id === "S_c_14" && card.type === "spell") {
    for (const oathChoice of OATH_CHOICES) {
      out.push({ type: "PLAY_SPELL", handIndex: lookup.handIndex, oathChoice });
    }
    return;
  }

  // S_c_15 裂痕召喚：必須帶 riftHandIndex 指向手牌中的另一張兵力
  if (card.id === "S_c_15" && card.type === "spell") {
    state.player.hand.forEach((inst, idx) => {
      if (idx === lookup.handIndex) return;
      try {
        const other = inst.cardId;
        // 透過 lookup-style；不引入 data/，故只能依賴 inst.cardId 對 ctx
        if (other === "S_c_15") return;
      } catch {
        return;
      }
      out.push({ type: "PLAY_SPELL", handIndex: lookup.handIndex, riftHandIndex: idx });
    });
    return;
  }

  if (!cardNeedsTarget(card, state)) {
    out.push({ type, handIndex: lookup.handIndex });
    return;
  }

  // 腳本卡：自家兵力目標（A_h_05）
  if (isScriptedSelfTroopTargetCard(card)) {
    for (const t of state.player.troopSlots) {
      if (t && canPlayCardTargetTroop(card, "player", t, false)) {
        out.push({ type, handIndex: lookup.handIndex, targetInstanceId: t.instanceId });
      }
    }
    return;
  }

  // 腳本卡：敵方任意（A_b_02）
  if (isScriptedEnemyAnyTargetCard(card)) {
    for (const t of aliveTroops(state.enemy)) {
      out.push({ type, handIndex: lookup.handIndex, targetInstanceId: t.instanceId });
    }
    out.push({ type, handIndex: lookup.handIndex, targetInstanceId: "H_enemy" });
    return;
  }

  // S_e_07：低量表時針對敵方目標
  if (card.id === "S_e_07") {
    for (const t of aliveTroops(state.enemy)) {
      out.push({ type, handIndex: lookup.handIndex, targetInstanceId: t.instanceId });
    }
    out.push({ type, handIndex: lookup.handIndex, targetInstanceId: "H_enemy" });
    return;
  }

  // 標準：依效果鏈第一個 single-target 推導
  const effects = effectsOf(card);
  const ignoreGuard = effectsIgnoreGuard(effects);
  const targets = enumerateTargetsForEffects(state, effects, ignoreGuard);
  for (const tgt of targets) {
    out.push({ type, handIndex: lookup.handIndex, targetInstanceId: tgt.id });
  }
}

function pushAttacks(out: GameAction[], state: BattleState): void {
  for (const attacker of aliveTroops(state.player)) {
    for (const t of aliveTroops(state.enemy)) {
      if (canTroopAttack(state, "player", attacker, t).ok) {
        out.push({ type: "TROOP_ATTACK", attackerInstanceId: attacker.instanceId, targetInstanceId: t.instanceId });
      }
    }
    if (canTroopAttack(state, "player", attacker, "hero").ok) {
      out.push({ type: "TROOP_ATTACK", attackerInstanceId: attacker.instanceId, targetInstanceId: "H_enemy" });
    }
    // 裂縫滲透體
    if (state.rift?.holder === "enemy" && state.rift.occupant) {
      if (canTroopAttack(state, "player", attacker, state.rift.occupant).ok) {
        out.push({ type: "TROOP_ATTACK", attackerInstanceId: attacker.instanceId, targetInstanceId: state.rift.occupant.instanceId });
      }
    }
  }
}

function pushSkills(out: GameAction[], state: BattleState, ctx: BattleContext): void {
  const heroDef = ctx.getHero(state.player.hero.defId);
  const hero = state.player.hero;
  const skillFrozen = isHeroAbilityFrozen(hero, "spell"); // 法術凍結也阻擋技能？保守：不過濾，留給 reducer 驗

  for (const skill of heroDef.actives) {
    if (skill.passive) continue;
    if (skill.cost.mana && !canAffordMana(state.player, skill.cost.mana)) continue;
    if (skill.cost.morale && !canAffordMorale(hero, skill.cost.morale)) continue;
    if (skill.cost.gauge && hero.gaugeValue < skill.cost.gauge) continue;
    const needsTarget = skill.effects.some((e) => "target" in e && (e.target as { kind?: string }).kind === "single");
    if (!needsTarget) {
      out.push({ type: "USE_SKILL", skillId: skill.id });
      continue;
    }
    const ignoreGuard = effectsIgnoreGuard(skill.effects);
    const targets = enumerateTargetsForEffects(state, skill.effects, ignoreGuard);
    for (const tgt of targets) {
      out.push({ type: "USE_SKILL", skillId: skill.id, targetInstanceId: tgt.id });
    }
  }

  // 終極技
  if (!hero.flags.ultimateUsed && hero.morale >= 100) {
    const ult = heroDef.ultimate;
    if ((!ult.cost.mana || canAffordMana(state.player, ult.cost.mana)) &&
        (!ult.cost.morale || canAffordMorale(hero, ult.cost.morale)) &&
        (!ult.cost.gauge || hero.gaugeValue >= ult.cost.gauge)) {
      const needsTarget = ult.effects.some((e) => "target" in e && (e.target as { kind?: string }).kind === "single");
      if (!needsTarget) {
        out.push({ type: "USE_ULTIMATE" });
      } else {
        const ignoreGuard = effectsIgnoreGuard(ult.effects);
        const targets = enumerateTargetsForEffects(state, ult.effects, ignoreGuard);
        for (const tgt of targets) {
          out.push({ type: "USE_ULTIMATE", targetInstanceId: tgt.id });
        }
      }
    }
  }
  void skillFrozen;
}

function pushForge(out: GameAction[], state: BattleState, ctx: BattleContext): void {
  const heroDef = ctx.getHero(state.player.hero.defId);
  const cls = ctx.getClass(heroDef.classId);
  if (cls.keyword !== "forge") return;
  if (state.player.hero.flags.forgeUsedThisTurn === true) return;
  if (!canAffordMana(state.player, 1)) return;
  if (state.player.hand.length >= 9) return;

  // 改造裝備：每張手牌都可能被熔毀，給每個 handIndex 都列出
  if (state.player.hand.length > 0) {
    state.player.hand.forEach((_, idx) => {
      out.push({ type: "FORGE_ACTION", mode: "equipment", handIndex: idx });
    });
  }
  // 製造器具：不耗手牌
  out.push({ type: "FORGE_ACTION", mode: "device" });
}

/**
 * 列舉玩家在當前 state 下所有可合法 dispatch 的 GameAction。
 * 與 reducer 的合法性檢查同源；該函式輸出可逐項直接 dispatch。
 * 「END_TURN」永遠加在最後。
 */
export function enumeratePlayerActions(state: BattleState, ctx: BattleContext): GameAction[] {
  const out: GameAction[] = [];
  if (state.activeSide !== "player" || state.result !== "ongoing") {
    out.push({ type: "END_TURN" });
    return out;
  }

  const hero = state.player.hero;
  const troopFrozen = isHeroAbilityFrozen(hero, "troop");
  const spellFrozen = isHeroAbilityFrozen(hero, "spell");
  const actionFrozen = isHeroAbilityFrozen(hero, "action");

  const lookups = lookupHand(state, ctx);
  const freeSlots = freeTroopSlots(state);
  const riftOpen = state.rift?.holder === "open";

  for (const lk of lookups) {
    if (!canPlayCardCheck(state, ctx, lk.card)) continue;
    switch (lk.card.type) {
      case "troop":
        if (troopFrozen) break;
        pushTroopDeployments(out, lk, freeSlots);
        if (riftOpen) {
          out.push({ type: "PLAY_TROOP_RIFT", handIndex: lk.handIndex });
        }
        break;
      case "spell":
        if (spellFrozen) break;
        pushSpellOrAction(out, state, lk);
        break;
      case "action":
        if (actionFrozen) break;
        pushSpellOrAction(out, state, lk);
        break;
      case "equipment":
        out.push({ type: "PLAY_EQUIPMENT", handIndex: lk.handIndex });
        break;
      case "field":
        out.push({ type: "PLAY_FIELD", handIndex: lk.handIndex });
        break;
      case "device":
        if (troopFrozen) break;
        // device 走 troopSlots
        pushTroopDeployments(out, lk, freeSlots);
        break;
    }
  }

  pushAttacks(out, state);
  pushSkills(out, state, ctx);
  pushForge(out, state, ctx);

  out.push({ type: "END_TURN" });
  return out;
}

export function describeAction(action: GameAction, state: BattleState, ctx: BattleContext): string {
  switch (action.type) {
    case "PLAY_TROOP": {
      const card = handCardName(state, ctx, action.handIndex);
      return `部署 ${card} 到第 ${action.slotIndex + 1} 格`;
    }
    case "PLAY_TROOP_RIFT": {
      const card = handCardName(state, ctx, action.handIndex);
      return `將 ${card} 部署至次元裂縫`;
    }
    case "PLAY_SPELL": {
      const card = handCardName(state, ctx, action.handIndex);
      const t = action.targetInstanceId ? targetName(state, action.targetInstanceId) : "";
      const oath = action.oathChoice ? `（誓言：${action.oathChoice}）` : "";
      const rift = action.riftHandIndex != null ? `（召喚手牌 #${action.riftHandIndex}）` : "";
      return `施法 ${card}${t ? ` → ${t}` : ""}${oath}${rift}`.trim();
    }
    case "PLAY_ACTION": {
      const card = handCardName(state, ctx, action.handIndex);
      const t = action.targetInstanceId ? targetName(state, action.targetInstanceId) : "";
      return `使用 ${card}${t ? ` → ${t}` : ""}`.trim();
    }
    case "PLAY_EQUIPMENT": return `裝備 ${handCardName(state, ctx, action.handIndex)}`;
    case "PLAY_FIELD": return `放置場地 ${handCardName(state, ctx, action.handIndex)}`;
    case "TROOP_ATTACK": {
      const a = findTroopAnywhere(state, action.attackerInstanceId);
      const aName = a ? cardName(ctx, a.troop.cardId) : action.attackerInstanceId;
      const tName = targetName(state, action.targetInstanceId);
      return `${aName} 攻擊 ${tName}`;
    }
    case "USE_SKILL": {
      const t = action.targetInstanceId ? ` → ${targetName(state, action.targetInstanceId)}` : "";
      return `主動技 ${action.skillId}${t}`;
    }
    case "USE_ULTIMATE": {
      const t = action.targetInstanceId ? ` → ${targetName(state, action.targetInstanceId)}` : "";
      return `終極技${t}`;
    }
    case "FORGE_ACTION":
      return action.mode === "equipment"
        ? `改造裝備（熔毀手牌 #${action.handIndex ?? 0}）`
        : "製造器具";
    case "END_TURN": return "結束回合";
  }
}

function handCardName(state: BattleState, ctx: BattleContext, handIndex: number): string {
  const inst = state.player.hand[handIndex];
  if (!inst) return `手牌#${handIndex}`;
  try {
    return ctx.getCard(inst.cardId).name;
  } catch {
    return inst.cardId;
  }
}

function cardName(ctx: BattleContext, cardId: string): string {
  try {
    return ctx.getCard(cardId).name;
  } catch {
    return cardId;
  }
}

function targetName(state: BattleState, id: string): string {
  if (id === "H_enemy") return "敵方英雄";
  if (id === "H_player") return "我方英雄";
  const found = findTroopAnywhere(state, id);
  if (!found) return id;
  return `${found.side === "player" ? "我方" : "敵方"}：${found.troop.cardId}`;
}
