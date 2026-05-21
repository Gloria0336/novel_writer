import type { Effect } from "./effect";

/**
 * BossGauge：每個 Boss 專屬的進度條，與種族量表（hero.gaugeValue）並存。
 *
 * 累積方式由 `triggers` 列舉的事件決定；累積到 `max` 時自動釋放 `burstEffects`，
 * 並將 value 歸零後可重複累積（與 `hero.ultimate` 的一場一次不同）。
 */

export type BossGaugeTriggerKind =
  /** 每自方兵力進場（包含手牌部署、池召喚、effect 召喚） */
  | "onSummon"
  /** 每自方施放法術 */
  | "onSpellCast"
  /** 每自方打出行動卡 */
  | "onActionPlay"
  /** 每自方兵力／英雄攻擊命中（不限目標） */
  | "onAttackHit"
  /** 每自方攻擊命中玩家英雄 */
  | "onAttackHitHero"
  /** 自方回合開始：每存活兵力數 × perUnit */
  | "onTroopSurvivePerTurn"
  /** 自身英雄被傷害時：每 1 HP × per1Hp */
  | "onHeroDamaged"
  /** 自身英雄被傷害時：依失血百分比累積（per1Pct × 失血%） */
  | "onHeroDamagedPct"
  /** 穩定度被改變時：每 5 點降幅 × per5（只計負向） */
  | "onStabilityDelta"
  /** 妖族形態切換時（FEY_FORM_SWITCH） */
  | "onFormSwitch"
  /** 凍結對方兵力時 */
  | "onFreezeEnemy"
  /** 自方場地灼燒對方時（DM_SCORCHED_FIELD / FIELD_BURN_APPLY tick） */
  | "onFieldBurnTick"
  /** 玩家方兵力被擊殺時 */
  | "onPlayerTroopKilled"
  /** 自身回合開始固定累積 */
  | "onTurnStart";

export interface BossGaugeTrigger {
  kind: BossGaugeTriggerKind;
  /** 固定加值（多數 trigger 使用此值） */
  amount?: number;
  /** onTroopSurvivePerTurn 用：每存活兵力加值 */
  perUnit?: number;
  /** onHeroDamaged 用：每 1 HP 加值 */
  per1Hp?: number;
  /** onHeroDamagedPct 用：每 1% 失血加值（如 1.0） */
  per1Pct?: number;
  /** onStabilityDelta 用：每 5 點負向變化加值 */
  per5?: number;
  /** 條件限制（例：onSummon 只計 specificCardId 為某 ID） */
  cardId?: string;
  /** 條件限制（例：onSummon 只計帶 keyword 的兵力，如 phantom） */
  troopTag?: "phantom" | "fey" | "berserker" | "shadow";
}

export interface BossGaugeSpec {
  /** 對應到 effect log 中的 source id 與 i18n key */
  id: string;
  /** 顯示名稱（中文） */
  name: string;
  description: string;
  /** 預設 100 */
  max: number;
  triggers: BossGaugeTrigger[];
  /** 滿值時釋放的 effect 串 */
  burstEffects: Effect[];
  /** UI toast 顯示文字 */
  burstLabel: string;
}

export interface BossGaugeState {
  value: number;
  spec: BossGaugeSpec;
  /** 最近一次釋放的 turn（debug / cooldown 用） */
  lastBurstTurn?: number;
  /** 釋放總次數 */
  burstCount: number;
}
