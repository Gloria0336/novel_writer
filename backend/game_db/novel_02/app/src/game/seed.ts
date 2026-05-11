import type { BattleState, SideState } from "../core/types/battle";
import type { BattleContext } from "../core/types/context";
import type { CardInstance } from "../core/types/card";
import type { HeroDefinition, HeroInstance } from "../core/types/hero";
import { rngShuffle } from "../core/deck/prng";
import { composeHeroStats } from "../core/stats/compose";
import { createLairHeroInstance, LAIR_HERO_DEF, LAIR_HERO_ID } from "../data/enemies/putrefactiveLair";
import { getCard } from "../data/cards";
import { getRace } from "../data/races";
import { getClass } from "../data/classes";
import { HEROES } from "../data/heroes";
import { runLairAITurn, previewLairIntent } from "../core/ai/lairAI";
import { applyAction, type ApplyResult } from "../core/turn/reducer";
import type { GameAction } from "../core/turn/actions";
import { advanceToNextSide, endTurnFor, startTurnFor } from "../core/turn/phases";
import { registerCoreScripted } from "../core/effects/handlers/scripted";
import { registerHeroScripted } from "../core/effects/handlers/heroes";
import { resetTurnFlags } from "../core/effects/handlers/scripted";

let SCRIPTED_REGISTERED = false;

export function ensureScriptedRegistered(): void {
  if (SCRIPTED_REGISTERED) return;
  registerCoreScripted();
  registerHeroScripted();
  SCRIPTED_REGISTERED = true;
}

export interface CreateBattleOpts {
  seed: number;
  playerHeroId: string;
  playerDeckIds: string[];
  initialHandSize?: number;
}

export function createBattleContext(): BattleContext {
  return {
    getCard,
    getHero: (id) => {
      if (id === LAIR_HERO_ID) return LAIR_HERO_DEF;
      const h = HEROES[id];
      if (!h) throw new Error(`Unknown hero: ${id}`);
      return h;
    },
    getRace: (id) => getRace(id as Parameters<typeof getRace>[0]),
    getClass: (id) => getClass(id as Parameters<typeof getClass>[0]),
  };
}

function makePlayerHeroInstance(def: HeroDefinition): HeroInstance {
  const race = getRace(def.raceId);
  const cls = getClass(def.classId);
  const stats = composeHeroStats(def, race, cls);
  return {
    defId: def.id,
    hp: stats.hp, maxHp: stats.hp,
    atk: stats.atk, def: stats.def, cmd: stats.cmd,
    morale: 0, gaugeValue: 0, armor: 0,
    buffs: [], equipment: {},
    flags: { ultimateUsed: false, immortalUsed: false },
  };
}

function buildSide(deckIds: readonly string[], hero: HeroInstance, manaCapAbsolute: number): SideState {
  const cmd = hero.cmd;
  const slotCount = Math.min(5, Math.max(1, cmd));
  return {
    hero,
    manaCurrent: 0, manaCap: 0, manaCapAbsolute, tempMana: 0,
    deck: deckIds.map((cardId, i) => ({ instanceId: `D_${i}_${cardId}`, cardId })),
    hand: [], graveyard: [],
    troopSlots: new Array(slotCount).fill(null),
    spellsCastThisTurn: 0, spellsCastThisGame: 0,
  };
}

export function createBattle(opts: CreateBattleOpts): BattleState {
  ensureScriptedRegistered();
  const ctx = createBattleContext();
  const playerHeroDef = ctx.getHero(opts.playerHeroId);
  const playerHero = makePlayerHeroInstance(playerHeroDef);
  const race = getRace(playerHeroDef.raceId);

  const playerSide = buildSide(opts.playerDeckIds, playerHero, race.manaCap ?? 10);

  // 洗牌
  const sh = rngShuffle(opts.seed, playerSide.deck);
  playerSide.deck = sh.value;

  // 巢穴設置
  const lairHero = createLairHeroInstance();
  const enemySide = buildSide([], lairHero, 10);

  let state: BattleState = {
    seed: opts.seed,
    rngState: sh.state,
    nextInstanceId: 1000,
    turn: 1,
    activeSide: "player",
    phase: "start",
    player: playerSide,
    enemy: enemySide,
    field: null,
    stability: 100,
    corruptionStage: 0,
    enemyIntent: "deploy",
    log: [],
    result: "ongoing",
  };

  // 起手 3 張
  const initialHandSize = opts.initialHandSize ?? 3;
  for (let i = 0; i < initialHandSize; i++) {
    const c = state.player.deck.shift();
    if (c) state.player.hand.push(c);
  }

  // 啟動玩家第一回合（refill mana 到 1，等等）
  startTurnFor(state, "player", ctx);
  state.enemyIntent = previewLairIntent(state);

  return state;
}

/**
 * 套用一個玩家動作；若是 END_TURN 則自動跑敵方回合並回到玩家。
 */
export function applyPlayerAction(state: BattleState, action: GameAction, ctx: BattleContext): ApplyResult {
  if (action.type === "END_TURN") {
    return endPlayerTurnAndRunAI(state, ctx);
  }
  return applyAction(state, action, ctx);
}

export function endPlayerTurnAndRunAI(state: BattleState, ctx: BattleContext): ApplyResult {
  if (state.result !== "ongoing") return { ok: false, reason: "battle ended" };

  // 結束玩家回合
  endTurnFor(state, "player");
  resetTurnFlags(state);

  // 切換到敵方
  advanceToNextSide(state);
  if (state.result !== "ongoing") return { ok: true };

  // 敵方回合（直接由 AI 操作，不抽牌不計魔力）
  state.phase = "main";
  state.log.push({ turn: state.turn, side: "enemy", kind: "TURN_START", text: `回合 ${state.turn}：敵方` });

  // 重置敵方兵力暈眩
  for (const t of state.enemy.troopSlots) {
    if (t) {
      t.summonedThisTurn = false;
      t.hasAttackedThisTurn = false;
      if (t.frozenTurns > 0) t.frozenTurns--;
    }
  }

  runLairAITurn(state, ctx);
  if (state.result !== "ongoing") return { ok: true };

  // 結束敵方回合，切回玩家
  endTurnFor(state, "enemy");
  advanceToNextSide(state);
  if (state.result !== "ongoing") return { ok: true };

  startTurnFor(state, "player", ctx);
  state.enemyIntent = previewLairIntent(state);
  return { ok: true };
}
