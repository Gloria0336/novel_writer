import type { BattleState, SideState } from "../core/types/battle";
import type { BattleContext } from "../core/types/context";
import type { HeroDefinition, HeroInstance } from "../core/types/hero";
import type { OmenId } from "../core/types/omen";
import { applyOmenOnEnter, createOmenInstance } from "../core/effects/omenHooks";
import { rngShuffle } from "../core/deck/prng";
import { composeHeroStats } from "../core/stats/compose";
import { ENEMIES, getEnemy } from "../data/enemies";
import { getCard } from "../data/cards";
import { getRace } from "../data/races";
import { getClass } from "../data/classes";
import { HEROES } from "../data/heroes";
import { runEnemyAITurn } from "../core/ai/engine";
import { ENEMY_PROFILES } from "../core/ai/profiles";
import { runLairAuras } from "../core/turn/lairAura";
import { executeEffects } from "../core/effects/registry";
import { applyAction, type ApplyResult } from "../core/turn/reducer";
import { applyActionWithTimeline, applyActionWithTimelineRunner, type TimelineApplyResult } from "../core/turn/timeline";
import type { GameAction } from "../core/turn/actions";
import { advanceToNextSide, endTurnFor, startTurnFor } from "../core/turn/phases";
import { registerCoreScripted } from "../core/effects/handlers/scripted";
import { registerHeroScripted } from "../core/effects/handlers/heroes";
import { resetTurnFlags } from "../core/effects/handlers/scripted";
import { registerRaceCardScripted } from "../core/effects/handlers/raceCards";
import { registerDeviceScripted } from "../core/effects/handlers/devices";

let SCRIPTED_REGISTERED = false;

export function ensureScriptedRegistered(): void {
  if (SCRIPTED_REGISTERED) return;
  registerCoreScripted();
  registerHeroScripted();
  registerRaceCardScripted();
  registerDeviceScripted();
  SCRIPTED_REGISTERED = true;
}

export const DEFAULT_ENEMY_ID = "putrefactive_lair";

export interface EnemyScale {
  hpMult: number;
  atkMult: number;
}

export interface CreateBattleOpts {
  seed: number;
  playerHeroId: string;
  playerDeckIds: string[];
  enemyId?: string;
  initialHand?: number;
  initialPlayerHero?: HeroInstance;
  enemyScale?: EnemyScale;
  /** TowerRun.activeOmen 帶入；戰鬥開始時生成 OmenInstance（隨機型用 rngState 抽持續回合）。 */
  omen?: OmenId | null;
}

const auraResolver = (defId: string): { onStart?: string[]; onEnd?: string[] } | undefined => {
  const e = ENEMIES[defId];
  return e?.auraTags;
};

export function createBattleContext(): BattleContext {
  return {
    getCard,
    getHero: (id) => {
      const enemy = ENEMIES[id];
      if (enemy) return enemy.heroDef;
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
    flags: {
      ultimateUsed: false,
      immortalUsed: false,
      ...(def.raceId === "fey" ? { feyForm: "human" as const } : {}),
    },
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
    destroyedDevices: [],
  };
}

function applyEnemyScale(hero: HeroInstance, scale: EnemyScale | undefined): HeroInstance {
  if (!scale) return hero;
  const scaled = { ...hero };
  scaled.maxHp = Math.max(1, Math.round(hero.maxHp * scale.hpMult));
  scaled.hp = Math.max(1, Math.round(hero.hp * scale.hpMult));
  scaled.atk = Math.max(0, Math.round(hero.atk * scale.atkMult));
  return scaled;
}

export function createBattle(opts: CreateBattleOpts): BattleState {
  ensureScriptedRegistered();
  const ctx = createBattleContext();
  const enemyId = opts.enemyId ?? DEFAULT_ENEMY_ID;
  const enemyDef = getEnemy(enemyId);

  const playerHeroDef = ctx.getHero(opts.playerHeroId);
  const playerHero = opts.initialPlayerHero ?? makePlayerHeroInstance(playerHeroDef);
  const race = getRace(playerHeroDef.raceId);

  const playerSide = buildSide(opts.playerDeckIds, playerHero, race.manaCap ?? 10);

  // 洗牌
  const sh = rngShuffle(opts.seed, playerSide.deck);
  playerSide.deck = sh.value;

  // 敵方建構
  const enemyHero = applyEnemyScale(enemyDef.createInstance(), opts.enemyScale);
  const enemySide = buildSide([], enemyHero, 10);

  let state: BattleState = {
    seed: opts.seed,
    rngState: sh.state,
    nextInstanceId: 1000,
    turn: 1,
    activeSide: "player",
    phase: "start",
    player: playerSide,
    enemy: enemySide,
    field: { player: null, enemy: null },
    omen: null,
    stability: 100,
    corruptionStage: 0,
    log: [],
    result: "ongoing",
  };

  // 起手 N 張（預設 3）
  const initialHandSize = opts.initialHand ?? 3;
  for (let i = 0; i < initialHandSize; i++) {
    const c = state.player.deck.shift();
    if (c) state.player.hand.push(c);
  }

  // §E.1 Boss onBattleStart（如炎魔獄火場地）—— 在天象進場前先決定 Boss 場地。
  if (enemyDef.onBattleStart && enemyDef.onBattleStart.length > 0) {
    executeEffects(enemyDef.onBattleStart, {
      state, ctx, sourceSide: "enemy", sourceKind: "passive",
    });
  }

  // v3.4 天象：戰鬥內擁有自己的 OmenInstance；放在 Boss onBattleStart 之後，
  // 確保碎片雨可摧毀 Boss 場地（若有）。
  if (opts.omen) {
    state.omen = createOmenInstance(opts.omen, state);
    state.log.push({ turn: state.turn, side: "player", kind: "OMEN_START", text: `天象「${state.omen.id}」生效（${state.omen.remainingTurns} 回合）` });
    applyOmenOnEnter(state);
  }

  // 啟動玩家第一回合
  startTurnFor(state, "player", ctx);

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

export function applyPlayerActionWithTimeline(state: BattleState, action: GameAction, ctx: BattleContext): TimelineApplyResult {
  if (action.type === "END_TURN") {
    return applyActionWithTimelineRunner(state, action, ctx, (runnerState, _action, runnerCtx) => endPlayerTurnAndRunAI(runnerState, runnerCtx));
  }
  return applyActionWithTimeline(state, action, ctx);
}

export function endPlayerTurnAndRunAI(state: BattleState, ctx: BattleContext): ApplyResult {
  if (state.result !== "ongoing") return { ok: false, reason: "battle ended" };

  // 結束玩家回合
  endTurnFor(state, "player", ctx);
  resetTurnFlags(state);

  // 切換到敵方
  advanceToNextSide(state);
  if (state.result !== "ongoing") return { ok: true };

  // 敵方回合
  // Enemy turn start: use the shared turn-start path so Bosses draw, refill mana,
  // gain turn-start gauge, and reset troop attack state just like players.
  startTurnFor(state, "enemy", ctx);
  if (state.result !== "ongoing") return { ok: true };

  // §E.2 巢穴 onStart 光環（例如魔獸洞穴半血爆發）
  runLairAuras(state, ctx, "start", auraResolver);
  if (state.result !== "ongoing") return { ok: true };

  // 取對應 AI profile
  const enemyDef = ENEMIES[state.enemy.hero.defId];
  const profileId = enemyDef?.profileId ?? "lair_putrefactive";
  const profile = ENEMY_PROFILES[profileId];
  if (!profile) {
    state.log.push({ turn: state.turn, side: "enemy", kind: "AI_ERROR", text: `找不到 AI profile: ${profileId}` });
  } else {
    runEnemyAITurn(state, ctx, profile);
  }
  if (state.result !== "ongoing") return { ok: true };

  // §E.2 巢穴 onEnd 光環（蟲族合併、晶體合併、神殿回血、暗影 tick）
  runLairAuras(state, ctx, "end", auraResolver);
  if (state.result !== "ongoing") return { ok: true };

  // 結束敵方回合
  endTurnFor(state, "enemy", ctx);
  advanceToNextSide(state);
  if (state.result !== "ongoing") return { ok: true };

  startTurnFor(state, "player", ctx);
  return { ok: true };
}
