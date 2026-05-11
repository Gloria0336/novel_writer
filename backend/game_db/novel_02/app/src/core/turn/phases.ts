import type { BattleState, SideState } from "../types/battle";
import type { Side } from "../types/effect";
import type { BattleContext } from "../types/context";
import { drawCards } from "../deck/draw";
import { refillMana } from "../resource/mana";
import { gaugeOnTroopSurvivePerTurn, gaugeOnTurnStart } from "../resource/gauge";
import { aliveTroops, getSide, otherSide } from "../selectors/battle";

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

  // 魔力上限 +1（受種族絕對上限封頂）
  refillMana(sideState, sideState.manaCapAbsolute, state.turn);

  // 重置回合計數
  sideState.spellsCastThisTurn = 0;

  // 處理英雄量表「回合開始」、「兵力存活」累積
  const aliveCount = aliveTroops(sideState).length;
  gaugeOnTroopSurvivePerTurn(sideState.hero, race.gauge.max, heroDef.gauge, aliveCount);
  gaugeOnTurnStart(sideState.hero, race.gauge.max, heroDef.gauge);

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
  }

  state.log.push({
    turn: state.turn,
    side,
    kind: "TURN_START",
    text: `回合 ${state.turn}：${side === "player" ? "玩家" : "敵方"}`,
  });

  state.phase = "main";
}

export function endTurnFor(state: BattleState, side: Side): void {
  state.phase = "end";
  // 兵力 buff/debuff 持續時間 -1
  const sideState = getSide(state, side);
  for (const t of sideState.troopSlots) {
    if (!t) continue;
    t.buffs = t.buffs
      .map((b) => ({ ...b, remainingTurns: b.remainingTurns - 1 }))
      .filter((b) => b.remainingTurns > 0);
  }
  // 英雄 buff 衰減
  sideState.hero.buffs = sideState.hero.buffs
    .map((b) => ({ ...b, remainingTurns: b.remainingTurns - 1 }))
    .filter((b) => b.remainingTurns > 0);

  state.log.push({ turn: state.turn, side, kind: "TURN_END", text: `回合 ${state.turn} 結束（${side === "player" ? "玩家" : "敵方"}）` });
}

export function advanceToNextSide(state: BattleState): void {
  const next = otherSide(state.activeSide);
  if (next === "player") {
    state.turn++;
  }
  state.activeSide = next;
}
