import type { BattleState } from "../types/battle";
import type { Side } from "../types/effect";
import type { OmenId, OmenInstance } from "../types/omen";
import type { BattleContext } from "../types/context";
import { nextRng } from "../deck/prng";
import { otherSide } from "../selectors/battle";

/**
 * 各天象的預設持續回合。number 為固定值；[min, max] 為隨機區間，
 * 由 createOmenInstance 在戰鬥開始時用 state.rngState 抽取，確保 replay 性。
 */
export const OMEN_DURATION: Record<OmenId, number | [number, number]> = {
  twin_moons: 5,
  minor_eclipse: 7,
  shard_rain: [3, 9],
  solar_eclipse: 10,
  meteor: [6, 12],
  spirit_surge: 4,
};

/** 從 OmenId 建立 OmenInstance；隨機型天象使用 state.rngState 抽取持續回合。 */
export function createOmenInstance(id: OmenId, state: BattleState): OmenInstance {
  const dur = OMEN_DURATION[id];
  if (typeof dur === "number") return { id, remainingTurns: dur };
  const [min, max] = dur;
  const roll = nextRng(state.rngState);
  state.rngState = roll.state;
  const remainingTurns = min + Math.floor(roll.value * (max - min + 1));
  return { id, remainingTurns };
}

/** 進場時觸發的天象副作用（目前僅碎片雨：50/50 摧毀一方既有場地）。 */
export function applyOmenOnEnter(state: BattleState): void {
  if (state.omen?.id !== "shard_rain") return;
  const sides: Side[] = [];
  if (state.field.player) sides.push("player");
  if (state.field.enemy) sides.push("enemy");
  if (sides.length === 0) return;
  let victim: Side;
  if (sides.length === 2) {
    const roll = nextRng(state.rngState);
    state.rngState = roll.state;
    victim = roll.value < 0.5 ? "player" : "enemy";
  } else {
    victim = sides[0]!;
  }
  state.field[victim] = null;
  state.log.push({ turn: state.turn, side: victim, kind: "OMEN_SHARD_RAIN", text: `碎片雨摧毀 ${victim === "player" ? "我方" : "敵方"} 場地` });
}

/** 某方回合開始時觸發的天象作用（流星墜命中判定）。 */
export function applyOmenOnTurnStart(state: BattleState, _ctx: BattleContext, side: Side): void {
  const omen = state.omen;
  if (!omen) return;
  if (omen.id === "meteor") {
    const roll = nextRng(state.rngState);
    state.rngState = roll.state;
    const threshold = 1 / Math.max(1, omen.remainingTurns);
    if (roll.value < threshold) {
      const victim = otherSide(side);
      // 摧毀對方場地（雙月同圓保護期內不會走到這裡，因為 omen 互斥）
      if (state.field[victim]) state.field[victim] = null;
      // 對對方英雄造 8 傷（簡化：直接扣血，不走 passives 以避免 omenHooks → registry 循環依賴）
      const victimHero = victim === "player" ? state.player.hero : state.enemy.hero;
      victimHero.hp = Math.max(0, victimHero.hp - 8);
      state.log.push({
        turn: state.turn,
        side,
        kind: "OMEN_METEOR_HIT",
        text: `流星墜命中 ${victim === "player" ? "我方" : "敵方"}：場地摧毀並損失 8 點生命`,
      });
      state.omen = null;
    }
  }
}

/** 某方回合結束時遞減 remainingTurns；歸零則清除天象。 */
export function applyOmenOnTurnEnd(state: BattleState, _ctx: BattleContext, side: Side): void {
  const omen = state.omen;
  if (!omen) return;
  omen.remainingTurns -= 1;
  if (omen.remainingTurns <= 0) {
    state.log.push({ turn: state.turn, side, kind: "OMEN_END", text: `天象「${omen.id}」結束` });
    state.omen = null;
  }
}

/** 場地造傷時，由天象套用倍率（雙月同圓 ×1.5；日蝕傷害類 → 0）。 */
export function applyOmenFieldDamageModifier(state: BattleState, _side: Side, base: number): number {
  const omen = state.omen;
  if (!omen) return base;
  switch (omen.id) {
    case "twin_moons": return Math.floor(base * 1.5);
    case "solar_eclipse": return 0;
    default: return base;
  }
}

/** 場地 buff/數值修飾（雙月同圓 ×1.5；副月凌主月 +1；日蝕 ×2）。 */
export function applyOmenFieldValueModifier(state: BattleState, _side: Side, base: number): number {
  const omen = state.omen;
  if (!omen || base === 0) return base;
  switch (omen.id) {
    case "twin_moons": return base > 0 ? Math.floor(base * 1.5) : Math.ceil(base * 1.5);
    case "minor_eclipse": return base > 0 ? base + 1 : base - 1;
    case "solar_eclipse": return base * 2;
    default: return base;
  }
}

/** 副月凌主月：法術費用 +1。 */
export function applyOmenSpellCostModifier(state: BattleState, base: number): number {
  return state.omen?.id === "minor_eclipse" ? base + 1 : base;
}

/** 嘗試在天象作用下摧毀指定 side 的場地；回傳是否成功摧毀。 */
export function tryOmenDestroyField(state: BattleState, side: Side): boolean {
  if (isFieldProtected(state, side)) return false;
  if (!state.field[side]) return false;
  state.field[side] = null;
  return true;
}

/** 場地是否處於保護期，不可被天象 / 卡牌摧毀（雙月同圓）。 */
export function isFieldProtected(state: BattleState, _side: Side): boolean {
  return state.omen?.id === "twin_moons";
}

/** 是否禁止放置新場地（碎片雨持續期間）。 */
export function canPlayField(state: BattleState, _side: Side): boolean {
  return state.omen?.id !== "shard_rain";
}

/** 天象是否讓場地放置 cost 變為 0（靈潮湧動）。 */
export function omenMakesFieldFree(state: BattleState): boolean {
  return state.omen?.id === "spirit_surge";
}

/** 天象使場地的回合開始效果觸發次數（靈潮湧動 = 2，其餘 = 1）。 */
export function omenFieldStartTurnTriggerCount(state: BattleState): number {
  return state.omen?.id === "spirit_surge" ? 2 : 1;
}
