import type { BattleState } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { BossGaugeTrigger } from "../types/bossGauge";
import { executeEffects } from "../effects/registry";

/**
 * 通用事件型別：所有 Boss 量表的累積入口。
 *
 * 設計原則：呼叫端只需提交事件 + payload，由 notifyBossGauge 統一比對 spec.triggers 並累積。
 * 不會直接 mutate hero.gaugeValue（種族量表是另一回事）。
 */
export type BossGaugeEvent =
  | { kind: "onSummon"; cardId: string }
  | { kind: "onSpellCast" }
  | { kind: "onActionPlay" }
  | { kind: "onAttackHit"; toHero: boolean }
  | { kind: "onTroopSurvivePerTurn"; aliveCount: number; berserkerCount: number; feyCount: number; phantomCount: number }
  | { kind: "onHeroDamaged"; amount: number; lostHpPct: number }
  | { kind: "onStabilityDelta"; delta: number }
  | { kind: "onFormSwitch" }
  | { kind: "onFreezeEnemy" }
  | { kind: "onFieldBurnTick" }
  | { kind: "onPlayerTroopKilled" }
  | { kind: "onTurnStart" };

/** 判斷 cardId 是否符合 troopTag 條件。 */
function cardMatchesTag(cardId: string, tag: NonNullable<BossGaugeTrigger["troopTag"]>): boolean {
  switch (tag) {
    case "fey":
      // 妖族兵力 T_f_*、百鬼夜行召喚的 T_s_32 妖獸
      return cardId.startsWith("T_f_") || cardId === "T_s_32";
    case "phantom":
      // 幻影 T_s_31（百鬼夜行人形召喚），以及夢魔宗主夢幻體 T_s_28
      return cardId === "T_s_31" || cardId === "T_s_28";
    case "berserker":
      // 獸族兵力 T_b_*（狂戰士主題）
      return cardId.startsWith("T_b_");
    case "shadow":
      // 惡魔/暗影類 T_de_*、T_s_28~T_s_30/34
      return cardId.startsWith("T_de_") || cardId === "T_s_28" || cardId === "T_s_29" || cardId === "T_s_30" || cardId === "T_s_34";
  }
}

/** 將單一 trigger 套到事件上，回傳該 trigger 貢獻的 delta（0 表不命中）。 */
function applyTrigger(trigger: BossGaugeTrigger, event: BossGaugeEvent): number {
  if (trigger.kind !== event.kind) return 0;

  switch (event.kind) {
    case "onSummon": {
      if (trigger.cardId && trigger.cardId !== event.cardId) return 0;
      if (trigger.troopTag && !cardMatchesTag(event.cardId, trigger.troopTag)) return 0;
      return trigger.amount ?? 0;
    }
    case "onAttackHit": {
      // amount 為固定加值；若 trigger 額外帶 cardId === "hero" 表示只算對英雄（保留擴充，目前不用）
      return trigger.amount ?? 0;
    }
    case "onTroopSurvivePerTurn": {
      const e = event as Extract<BossGaugeEvent, { kind: "onTroopSurvivePerTurn" }>;
      const perUnit = trigger.perUnit ?? 0;
      if (perUnit === 0) return 0;
      if (trigger.troopTag === "berserker") return e.berserkerCount * perUnit;
      if (trigger.troopTag === "fey") return e.feyCount * perUnit;
      if (trigger.troopTag === "phantom") return e.phantomCount * perUnit;
      return e.aliveCount * perUnit;
    }
    case "onHeroDamaged": {
      const e = event as Extract<BossGaugeEvent, { kind: "onHeroDamaged" }>;
      const per1Hp = trigger.per1Hp ?? 0;
      const per1Pct = trigger.per1Pct ?? 0;
      return e.amount * per1Hp + e.lostHpPct * per1Pct;
    }
    case "onStabilityDelta": {
      const e = event as Extract<BossGaugeEvent, { kind: "onStabilityDelta" }>;
      if (e.delta >= 0) return 0;
      const per5 = trigger.per5 ?? 0;
      return Math.floor(Math.abs(e.delta) / 5) * per5;
    }
    default:
      return trigger.amount ?? 0;
  }
}

/**
 * 通知 BossGauge 一個事件；累積符合 spec.triggers 的 delta。
 * 累積後若 value ≥ max → 立即釋放 burstEffects 並歸零。
 *
 * 由各 reducer/phases/scripted handler 呼叫；無 bossGauge 時 no-op。
 */
export function notifyBossGauge(state: BattleState, ctx: BattleContext, event: BossGaugeEvent): void {
  if (!state.bossGauge) return;
  if (state.result !== "ongoing") return;
  const { spec } = state.bossGauge;

  let delta = 0;
  for (const trigger of spec.triggers) {
    delta += applyTrigger(trigger, event);
  }
  if (delta <= 0) return;

  addBossGaugeRaw(state, ctx, delta, event.kind);
}

/** 直接加值（內部測試用）；同樣會觸發 burst。 */
export function addBossGaugeRaw(state: BattleState, ctx: BattleContext, delta: number, reason: string): void {
  if (!state.bossGauge) return;
  const before = state.bossGauge.value;
  state.bossGauge.value = Math.min(state.bossGauge.spec.max, before + delta);
  state.log.push({
    turn: state.turn,
    side: "enemy",
    kind: "BOSS_GAUGE",
    text: `${state.bossGauge.spec.name} ${before} → ${state.bossGauge.value} (+${delta} ${reason})`,
    payload: { reason, delta, before, after: state.bossGauge.value, max: state.bossGauge.spec.max },
  });

  if (state.bossGauge.value >= state.bossGauge.spec.max) {
    triggerBossBurst(state, ctx);
  }
}

/** 釋放 burst：執行 burstEffects、歸零、計數、寫 log。 */
export function triggerBossBurst(state: BattleState, ctx: BattleContext): void {
  if (!state.bossGauge) return;
  const spec = state.bossGauge.spec;
  state.bossGauge.value = 0;
  state.bossGauge.lastBurstTurn = state.turn;
  state.bossGauge.burstCount++;

  state.log.push({
    turn: state.turn,
    side: "enemy",
    kind: "BOSS_BURST",
    text: spec.burstLabel,
    payload: { specId: spec.id, burstCount: state.bossGauge.burstCount, label: spec.burstLabel },
  });

  executeEffects(spec.burstEffects, {
    state,
    ctx,
    sourceSide: "enemy",
    sourceKind: "passive",
    sourceCardId: `BURST_${spec.id}`,
  });
}
