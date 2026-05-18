import type { ActiveBuff, HeroInstance } from "../types/hero";
import type { BattleState, SideState, TroopInstance } from "../types/battle";
import type { Side, StatModifier } from "../types/effect";
import type { BattleContext } from "../types/context";
import type { Keyword } from "../types/keyword";
import { drawCards } from "../deck/draw";
import { refillMana } from "../resource/mana";
import { gaugeOnTroopSurvivePerTurn, gaugeOnTurnStart } from "../resource/gauge";
import { tickRiftTremor } from "../resource/rift";
import { aliveTroops, getSide, otherSide } from "../selectors/battle";
import { isHeroAbilityFrozen, tickHeroAbilityFreezes } from "../effects/heroAbilityFreeze";
import { executeEffects } from "../effects/registry";
import { applyFullGaugeTurnStartBonuses, isFullGaugeBuffSource, syncFullGaugeBuffs } from "../resource/fullGaugeBuff";

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

  const sideState = getSide(state, side);
  const heroDef = ctx.getHero(sideState.hero.defId);
  const race = ctx.getRace(heroDef.raceId);

  // 抽 1 張
  const draw = drawCards(sideState, 1, state.rngState);
  state.rngState = draw.newRngState;

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

  syncFullGaugeBuffs(state, ctx);
  applyFullGaugeTurnStartBonuses(state, ctx, side);

  // 重置回合計數
  sideState.spellsCastThisTurn = 0;

  // 處理英雄量表「回合開始」、「兵力存活」累積
  const aliveCount = aliveTroops(sideState).length;
  gaugeOnTroopSurvivePerTurn(sideState.hero, race.gauge.max, heroDef.gauge, aliveCount);
  gaugeOnTurnStart(sideState.hero, race.gauge.max, heroDef.gauge);
  syncFullGaugeBuffs(state, ctx);

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

  // 解除兵力暈眩、重置攻擊狀態、減少凍結
  for (const t of sideState.troopSlots) {
    if (!t) continue;
    t.summonedThisTurn = false;
    t.hasAttackedThisTurn = false;
    if (t.frozenTurns > 0) t.frozenTurns--;
  }

  // 量表類型：精靈共鳴每回合重置
  if (race.gauge.id === "resonance") {
    sideState.hero.gaugeValue = 0;
    syncFullGaugeBuffs(state, ctx);
  }

  state.log.push({
    turn: state.turn,
    side,
    kind: "TURN_START",
    text: `回合 ${state.turn}：${side === "player" ? "玩家" : "敵方"}`,
  });

  state.phase = "main";
}

export function endTurnFor(state: BattleState, side: Side, ctx?: BattleContext): void {
  state.phase = "end";
  const sideState = getSide(state, side);

  // 兵力 buff/debuff/臨時關鍵字持續時間 -1，過期時回復數值與關鍵字。
  for (const t of sideState.troopSlots) {
    if (!t) continue;
    tickTroopBuffs(t);
    tickTroopKeywordBuffs(t, ctx);
  }

  // 英雄 buff 衰減，過期時回復數值。
  tickHeroBuffs(sideState.hero);
  tickHeroAbilityFreezes(sideState.hero);

  state.log.push({ turn: state.turn, side, kind: "TURN_END", text: `回合 ${state.turn} 結束（${side === "player" ? "玩家" : "敵方"}）` });

  // v3.3：tick 次元滲透裂縫倒數（僅在裂縫開啟時生效）
  if (ctx) tickRiftTremor(state, ctx);
}

export function advanceToNextSide(state: BattleState): void {
  const next = otherSide(state.activeSide);
  if (next === "player") {
    state.turn++;
  }
  state.activeSide = next;
}

function tickTroopBuffs(troop: TroopInstance): void {
  const kept: ActiveBuff[] = [];
  for (const buff of troop.buffs) {
    if (isFullGaugeBuffSource(buff.source)) {
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
    if (isFullGaugeBuffSource(buff.source)) {
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

function getBaseKeywords(troop: TroopInstance, ctx?: BattleContext): Set<Keyword> {
  if (!ctx) return new Set();
  const card = ctx.getCard(troop.cardId);
  return card.type === "troop" ? new Set(card.keywords) : new Set();
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
