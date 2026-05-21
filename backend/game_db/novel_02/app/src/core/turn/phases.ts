import type { ActiveBuff, HeroInstance } from "../types/hero";
import type { BattleState, SideState, TroopInstance } from "../types/battle";
import type { Side, StatModifier } from "../types/effect";
import type { BattleContext } from "../types/context";
import type { Keyword } from "../types/keyword";
import type { ActiveStatusBuff } from "../types/status";
import { drawCards } from "../deck/draw";
import { nextRng, rngPick } from "../deck/prng";
import { addTempMana, refillMana } from "../resource/mana";
import { addGauge, gaugeOnTroopSurvivePerTurn, gaugeOnTurnStart } from "../resource/gauge";
import { tickRiftTremor } from "../resource/rift";
import { aliveTroops, getSide, otherSide } from "../selectors/battle";
import { isHeroAbilityFrozen, tickHeroAbilityFreezes } from "../effects/heroAbilityFreeze";
import { executeEffects, reapDeadTroops } from "../effects/registry";
import { applyFullGaugeTurnStartBonuses, isFullGaugeBuffSource, syncFullGaugeBuffs } from "../resource/fullGaugeBuff";
import { applyTroopDamageWithPassives } from "../effects/battlePassives";
import { getFirstEquipmentPassivePayload, sideHasEquipmentPassive } from "../effects/passiveTags";
import { resetTurnFlags } from "./turnFlags";
import { syncDynamicPassiveAuras, isDynamicPassiveSource } from "../effects/dynamicPassives";
import { applyCorruptionStageEffects, applyStabilityDelta } from "../resource/stability";
import { applyOmenFieldDamageModifier, applyOmenOnTurnEnd, applyOmenOnTurnStart, omenFieldStartTurnTriggerCount } from "../effects/omenHooks";
import { notifyBossGauge } from "../resource/bossGauge";

export function checkVictory(state: BattleState): void {
  if (state.result !== "ongoing") return;
  if (state.player.hero.hp <= 0) {
    state.result = "playerLose";
    state.endgameReason = "玩家英雄陣亡";
    state.log.push({ turn: state.turn, side: state.activeSide, kind: "DEFEAT", text: "玩家英雄陣亡" });
    return;
  }
  if (state.enemy.hero.hp <= 0) {
    state.result = "playerWin";
    state.endgameReason = "敵方英雄陣亡";
    state.log.push({ turn: state.turn, side: state.activeSide, kind: "VICTORY", text: "擊敗敵方英雄/巢穴！" });
    return;
  }
  if (state.stability <= 0) {
    state.result = "playerLose";
    state.endgameReason = "次元壁崩潰";
  }
}

export function startTurnFor(state: BattleState, side: Side, ctx: BattleContext): void {
  state.activeSide = side;
  state.phase = "start";
  resetTurnFlags(state);

  const sideState = getSide(state, side);
  const heroDef = ctx.getHero(sideState.hero.defId);
  const race = ctx.getRace(heroDef.raceId);

  // 抽 1 張
  const draw = drawCards(sideState, 1, state.rngState);
  state.rngState = draw.newRngState;

  applyLuckyDraw(state, ctx, side, sideState);

  // 魔力上限 +1（受種族絕對上限封頂）；魔力回復凍結時跳過回復但清掉臨時魔力。
  if (isHeroAbilityFrozen(sideState.hero, "manaRegen")) {
    sideState.tempMana = 0;
    state.log.push({
      turn: state.turn,
      side,
      kind: "MANA_REGEN_FROZEN",
      text: `${side === "player" ? "玩家" : "敵方"}魔力回復被凍結`,
    });
  } else {
    refillMana(sideState, sideState.manaCapAbsolute, state.turn);
  }

  applyOmenOnTurnStart(state, ctx, side);
  applyStartTurnFieldEffects(state, ctx, side);
  applyStartTurnEquipmentPassives(state, ctx, side, sideState, race.gauge.max);

  syncFullGaugeBuffs(state, ctx);
  syncDynamicPassiveAuras(state, ctx);
  applyFullGaugeTurnStartBonuses(state, ctx, side);

  // 重置回合計數
  sideState.spellsCastThisTurn = 0;

  // 處理英雄量表「回合開始」、「兵力存活」累積
  const aliveCount = aliveTroops(sideState).length;
  gaugeOnTroopSurvivePerTurn(sideState.hero, race.gauge.max, heroDef.gauge, aliveCount);
  gaugeOnTurnStart(sideState.hero, race.gauge.max, heroDef.gauge);
  syncFullGaugeBuffs(state, ctx);

  // BossGauge：敵方回合開始時累積（onTurnStart + onTroopSurvivePerTurn）
  if (side === "enemy" && state.bossGauge) {
    const aliveList = aliveTroops(sideState);
    let berserkerCount = 0, feyCount = 0, phantomCount = 0;
    for (const t of aliveList) {
      if (t.cardId.startsWith("T_b_")) berserkerCount++;
      if (t.cardId.startsWith("T_f_") || t.cardId === "T_s_32") feyCount++;
      if (t.cardId === "T_s_31" || t.cardId === "T_s_28" || t.isPhantom) phantomCount++;
    }
    notifyBossGauge(state, ctx, { kind: "onTurnStart" });
    notifyBossGauge(state, ctx, {
      kind: "onTroopSurvivePerTurn",
      aliveCount: aliveList.length,
      berserkerCount, feyCount, phantomCount,
    });
  }

  // 幻術師職業關鍵字：每個己方回合開始，若有空欄，生成 1 個幻影。
  const cls = ctx.getClass(heroDef.classId);
  if (cls.keyword === "phantom") {
    executeEffects([{ kind: "scripted", tag: "ILLUSIONIST_TURN_PHANTOM" }], {
      state,
      ctx,
      sourceSide: side,
      sourceKind: "passive",
      sourceCardId: "ILLUSIONIST_TURN_PHANTOM",
    });
  }

  // 芙爾卓被動「百年戰場記憶」：場上有兵力時於回合開始給 3 護甲。
  if (sideState.hero.defId === "fuldra") {
    executeEffects([{ kind: "scripted", tag: "FULDRA_VIGIL" }], {
      state,
      ctx,
      sourceSide: side,
      sourceKind: "passive",
      sourceCardId: "FULDRA_VIGIL",
    });
  }

  // 解除兵力暈眩、重置攻擊狀態、減少凍結
  for (const t of [...sideState.troopSlots, sideState.frontlineSlot ?? null]) {
    if (!t) continue;
    t.summonedThisTurn = false;
    t.hasAttackedThisTurn = false;
    if (t.frozenTurns > 0) {
      t.frozenTurns--;
      if (t.frozenTurns <= 0) delete t.frozenDisplayName;
    }
  }

  // 鍛造師職業：重置「改造/製造」每回合限額
  sideState.hero.flags.forgeUsedThisTurn = false;

  // 量表類型：精靈共鳴每回合重置
  if (race.gauge.id === "resonance") {
    if (sideState.hero.flags.resonanceNoReset === true) sideState.hero.flags.resonanceNoReset = false;
    else sideState.hero.gaugeValue = 0;
    syncFullGaugeBuffs(state, ctx);
  }

  // 兵力 / 器具的 onTurnStart hook：在凍結倒數後執行，被暈眩中（frozenTurns > 0）的單位跳過
  for (const t of [...sideState.troopSlots, sideState.frontlineSlot ?? null]) {
    if (!t || t.frozenTurns > 0) continue;
    const card = ctx.getCard(t.cardId);
    const hooks = (card.type === "troop" || card.type === "device") ? card.onTurnStart : undefined;
    if (hooks && hooks.length > 0) {
      executeEffects(hooks, { state, ctx, sourceSide: side, sourceKind: "passive", sourceInstanceId: t.instanceId, sourceCardId: t.cardId });
    }
  }

  state.log.push({
    turn: state.turn,
    side,
    kind: "TURN_START",
    text: `回合 ${state.turn}：${side === "player" ? "玩家" : "敵方"}`,
  });

  state.phase = "main";
  syncDynamicPassiveAuras(state, ctx);
}

export function endTurnFor(state: BattleState, side: Side, ctx?: BattleContext): void {
  state.phase = "end";
  const sideState = getSide(state, side);

  // 兵力 / 器具的 onTurnEnd hook：在 tick buff 之前執行（避免 buff 倒數後才開砲）
  // 暈眩中（frozenTurns > 0）的單位跳過。
  if (ctx) {
  for (const t of [...sideState.troopSlots, sideState.frontlineSlot ?? null]) {
    if (!t || t.frozenTurns > 0) continue;
      const card = ctx.getCard(t.cardId);
      const hooks = (card.type === "troop" || card.type === "device") ? card.onTurnEnd : undefined;
      if (hooks && hooks.length > 0) {
        executeEffects(hooks, { state, ctx, sourceSide: side, sourceKind: "passive", sourceInstanceId: t.instanceId, sourceCardId: t.cardId });
      }
    }
  }

  // 兵力 buff/debuff/臨時關鍵字持續時間 -1，過期時回復數值與關鍵字。
  for (const t of sideState.troopSlots) {
    if (!t) continue;
    tickTroopBuffs(t);
    tickTroopKeywordBuffs(t, ctx);
    tickStatusBuffs(t);
  }
  if (sideState.frontlineSlot) {
    tickTroopBuffs(sideState.frontlineSlot);
    tickTroopKeywordBuffs(sideState.frontlineSlot, ctx);
    tickStatusBuffs(sideState.frontlineSlot);
  }
  expirePhantoms(state, side);

  // 英雄 buff 衰減，過期時回復數值。
  tickHeroBuffs(sideState.hero);
  tickStatusBuffs(sideState.hero);
  tickHeroAbilityFreezes(sideState.hero);
  tickHeroEffectFlags(sideState.hero);
  if (ctx) syncDynamicPassiveAuras(state, ctx);

  state.log.push({ turn: state.turn, side, kind: "TURN_END", text: `回合 ${state.turn} 結束（${side === "player" ? "玩家" : "敵方"}）` });

  // v3.3：tick 次元滲透裂縫倒數（僅在裂縫開啟時生效）
  if (ctx) tickRiftTremor(state, ctx);

  // v3.4：天象倒數遞減（每方結束回合各 -1）
  if (ctx) applyOmenOnTurnEnd(state, ctx, side);
}

export function advanceToNextSide(state: BattleState): void {
  const next = otherSide(state.activeSide);
  if (next === "player") {
    state.turn++;
  }
  state.activeSide = next;
}

function applyLuckyDraw(state: BattleState, ctx: BattleContext, side: Side, sideState: SideState): void {
  if (!sideHasEquipmentPassive(ctx, sideState, "LUCKY_DRAW_CHANCE")) return;
  const payload = getFirstEquipmentPassivePayload<{ pct?: number }>(ctx, sideState, "LUCKY_DRAW_CHANCE");
  const pct = payload?.pct ?? 30;
  const roll = nextRng(state.rngState);
  state.rngState = roll.state;
  if (roll.value * 100 >= pct) return;
  const draw = drawCards(sideState, 1, state.rngState);
  state.rngState = draw.newRngState;
  if (draw.drawn > 0) state.log.push({ turn: state.turn, side, kind: "LUCKY_DRAW", text: "Lucky draw +1" });
}

function applyStartTurnEquipmentPassives(state: BattleState, ctx: BattleContext, side: Side, sideState: SideState, gaugeMax: number): void {
  if (sideHasEquipmentPassive(ctx, sideState, "Y_ESSENCE_CORE")) sideState.hero.flags.essenceMaxBonus = 50;
  else delete sideState.hero.flags.essenceMaxBonus;
  if (sideHasEquipmentPassive(ctx, sideState, "DRAGONSCALE")) {
    sideState.hero.hp = Math.min(sideState.hero.maxHp, sideState.hero.hp + 3);
  }
  if (sideHasEquipmentPassive(ctx, sideState, "MOON_RELIC")) {
    addGauge(sideState.hero, gaugeMax, 10);
  }
}

function applyStartTurnFieldEffects(state: BattleState, ctx: BattleContext, side: Side): void {
  // 新語意：以「side 自己槽位上的場地」為主，效果作用於該方。
  const field = state.field[side];
  if (!field) return;

  // v3.4 天象「靈潮湧動」：場地回合開始效果觸發兩次。
  const triggers = omenFieldStartTurnTriggerCount(state);
  for (let n = 0; n < triggers; n++) {
    runFieldStartTurnEffectsOnce(state, ctx, side, field.cardId);
  }
}

function runFieldStartTurnEffectsOnce(state: BattleState, ctx: BattleContext, side: Side, cardId: string): void {
  const active = getSide(state, side);
  let damaged = false;

  // F_c_04 魔力節點：每回合 +1 臨時魔力給槽位方。
  if (cardId === "F_c_04") {
    addTempMana(active, 1);
  }

  // F_dw_01 深山礦坑：每回合 +10 量表。
  if (cardId === "F_dw_01") {
    const heroDef = ctx.getHero(active.hero.defId);
    const race = ctx.getRace(heroDef.raceId);
    addGauge(active.hero, race.gauge.max, 10);
  }

  // F_de_01 黑暗次元裂縫：穩定度 -3、量表 +5。
  if (cardId === "F_de_01") {
    const r = applyStabilityDelta(state, -3, ctx);
    applyCorruptionStageEffects(state, r.stageJustReached);
    const heroDef = ctx.getHero(active.hero.defId);
    const race = ctx.getRace(heroDef.raceId);
    addGauge(active.hero, race.gauge.max, 5);
  }

  // F_c_05 荒蕪焦土（self 槽位）：每回合燒「槽位方自己」全兵力 3 火傷。
  if (cardId === "F_c_05") {
    const dmg = applyOmenFieldDamageModifier(state, side, 3);
    if (dmg > 0) damaged = damageSideTroops(state, ctx, side, side, dmg, "fire") || damaged;
  }

  // F_s_01 獄火（敵方放在被籠罩方槽位）：每回合燒槽位方全兵力 2 火傷。
  if (cardId === "F_s_01") {
    const dmg = applyOmenFieldDamageModifier(state, side, 2);
    if (dmg > 0) damaged = damageSideTroops(state, ctx, side, side, dmg, "fire") || damaged;
  }

  // F_c_07 風暴山脊（enemy 槽位）：每回合對槽位方首個活躍兵力造 6 點傷。
  if (cardId === "F_c_07") {
    const targets = aliveTroops(active);
    const dmg = applyOmenFieldDamageModifier(state, side, 6);
    if (targets.length > 0 && dmg > 0) {
      const pick = rngPick(state.rngState, targets);
      state.rngState = pick.state;
      const target = pick.value;
      applyTroopDamageWithPassives(state, ctx, side, target, dmg, { sourceKind: "field" });
      state.log.push({
        turn: state.turn,
        side,
        kind: "FIELD_STORM",
        text: `風暴山脊隨機命中 ${target.cardId}，造成 ${dmg} 傷害`,
        payload: { targetInstanceId: target.instanceId, cardId: target.cardId, damage: dmg },
      });
      damaged = true;
    }
  }

  // F_de_02 焦黑荒原（self 槽位）：每回合對「對方」兵力造 4 火傷。
  if (cardId === "F_de_02") {
    const dmg = applyOmenFieldDamageModifier(state, side, 4);
    if (dmg > 0) damaged = damageSideTroops(state, ctx, side, otherSide(side), dmg, "fire") || damaged;
  }

  if (damaged) reapDeadTroops(state, ctx, side);
}

function damageSideTroops(
  state: BattleState,
  ctx: BattleContext,
  sourceSide: Side,
  targetSide: Side,
  amount: number,
  family: "fire" | "normal",
): boolean {
  let damaged = false;
  for (const troop of aliveTroops(getSide(state, targetSide))) {
    const result = applyTroopDamageWithPassives(state, ctx, targetSide, troop, amount, { sourceKind: "field", damageFamily: family });
    damaged = result.finalAmount > 0 || damaged;
  }
  if (damaged) state.log.push({ turn: state.turn, side: sourceSide, kind: "FIELD_DAMAGE", text: `Field damage ${amount}` });
  return damaged;
}

function tickHeroEffectFlags(hero: HeroInstance): void {
  const barrierTurns = hero.flags.divineBarrierTurns as number | undefined;
  if (barrierTurns !== undefined) {
    const next = barrierTurns - 1;
    if (next > 0) hero.flags.divineBarrierTurns = next;
    else {
      delete hero.flags.divineBarrierTurns;
      delete hero.flags.divineBarrierPct;
    }
  }
  delete hero.flags.damageReducePctThisTurn;
  tickNumberFlag(hero, "primordialFey");
  tickNumberFlag(hero, "rageLockTurns");
}

function tickNumberFlag(hero: HeroInstance, key: string): void {
  const value = hero.flags[key] as number | undefined;
  if (value === undefined) return;
  const next = value - 1;
  if (next > 0) hero.flags[key] = next;
  else delete hero.flags[key];
}

function tickTroopBuffs(troop: TroopInstance): void {
  const kept: ActiveBuff[] = [];
  for (const buff of troop.buffs) {
    if (isFullGaugeBuffSource(buff.source) || isDynamicPassiveSource(buff.source)) {
      kept.push(buff);
      continue;
    }
    const next = { ...buff, remainingTurns: buff.remainingTurns - 1 };
    if (next.remainingTurns > 0) {
      kept.push(next);
      continue;
    }
    revertTroopMod(troop, buff.mod);
  }
  troop.buffs = kept;
}

function tickHeroBuffs(hero: HeroInstance): void {
  const kept: ActiveBuff[] = [];
  for (const buff of hero.buffs) {
    if (isFullGaugeBuffSource(buff.source) || isDynamicPassiveSource(buff.source)) {
      kept.push(buff);
      continue;
    }
    const next = { ...buff, remainingTurns: buff.remainingTurns - 1 };
    if (next.remainingTurns > 0) {
      kept.push(next);
      continue;
    }
    revertHeroMod(hero, buff.mod);
  }
  hero.buffs = kept;
}

function tickStatusBuffs(unit: { statusBuffs?: ActiveStatusBuff[] }): void {
  if (!unit.statusBuffs || unit.statusBuffs.length === 0) return;
  unit.statusBuffs = unit.statusBuffs
    .map((buff) => ({ ...buff, remainingTurns: buff.remainingTurns - 1 }))
    .filter((buff) => buff.remainingTurns > 0);
}

function tickTroopKeywordBuffs(troop: TroopInstance, ctx?: BattleContext): void {
  if (!troop.keywordBuffs || troop.keywordBuffs.length === 0) return;

  const kept = [];
  const expired = [];
  for (const buff of troop.keywordBuffs) {
    const next = { ...buff, remainingTurns: buff.remainingTurns - 1 };
    if (next.remainingTurns > 0) kept.push(next);
    else expired.push(next);
  }

  troop.keywordBuffs = kept;
  if (expired.length === 0) return;

  const baseKeywords = getBaseKeywords(troop, ctx);
  for (const buff of expired) {
    const stillGranted = kept.some((active) => active.keyword === buff.keyword);
    if (!stillGranted && !baseKeywords.has(buff.keyword)) {
      troop.keywords.delete(buff.keyword);
    }
  }
}

function expirePhantoms(state: BattleState, side: Side): void {
  const sideState = getSide(state, side);
  for (let i = 0; i < sideState.troopSlots.length; i++) {
    const troop = sideState.troopSlots[i];
    if (!troop?.isPhantom) continue;
    troop.phantomTurnsRemaining = (troop.phantomTurnsRemaining ?? 1) - 1;
    if (troop.phantomTurnsRemaining > 0) continue;
    sideState.troopSlots[i] = null;
    state.log.push({
      turn: state.turn,
      side,
      kind: "PHANTOM_FADE",
      text: "幻影自動消散",
      payload: { instanceId: troop.instanceId, cardId: troop.cardId, slotIndex: i },
    });
  }
}

function getBaseKeywords(troop: TroopInstance, ctx?: BattleContext): Set<Keyword> {
  if (!ctx) return new Set();
  const card = ctx.getCard(troop.cardId);
  if (card.type === "troop") return new Set(card.keywords);
  if (card.type === "device") {
    // Device 型態變化時的基準關鍵字以當前 form 為準
    if (card.form && troop.deviceForm) {
      const formKw = card.form[troop.deviceForm].keywords;
      if (formKw) return new Set(formKw);
    }
    return new Set(card.keywords);
  }
  return new Set();
}

function revertTroopMod(troop: TroopInstance, mod: StatModifier): void {
  if (mod.atk) troop.atk = Math.max(0, troop.atk - mod.atk);
  if (mod.def) troop.def = Math.max(0, troop.def - mod.def);
  if (mod.hp) {
    troop.maxHp = Math.max(1, troop.maxHp - mod.hp);
    troop.hp = Math.min(troop.maxHp, Math.max(1, troop.hp - mod.hp));
  }
}

function revertHeroMod(hero: HeroInstance, mod: StatModifier): void {
  if (mod.atk) hero.atk = Math.max(0, hero.atk - mod.atk);
  if (mod.def) hero.def = Math.max(0, hero.def - mod.def);
  if (mod.cmd) hero.cmd = Math.max(0, hero.cmd - mod.cmd);
  if (mod.hp) {
    hero.maxHp = Math.max(1, hero.maxHp - mod.hp);
    hero.hp = Math.min(hero.maxHp, Math.max(1, hero.hp - mod.hp));
  }
}
