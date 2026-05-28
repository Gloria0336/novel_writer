import { describe, expect, it } from "vitest";
import { getCard } from "../../data/cards";
import { createBattleContext, ensureScriptedRegistered } from "../../game/seed";
import type { BattleState, TroopInstance } from "../types/battle";
import { endTurnFor, startTurnFor } from "./phases";

function freshTroop(cardId: string, instanceId: string): TroopInstance {
  const card = getCard(cardId);
  if (card.type !== "troop") throw new Error("not a troop");
  return {
    instanceId,
    cardId,
    hp: card.hp,
    maxHp: card.hp,
    atk: card.atk,
    def: card.def,
    keywords: new Set(card.keywords),
    hasAttackedThisTurn: false,
    summonedThisTurn: false,
    frozenTurns: 0,
    buffs: [],
    keywordBuffs: [],
    statusBuffs: [],
  };
}

function mkState(lairId: string): BattleState {
  return {
    seed: 1,
    rngState: 1,
    nextInstanceId: 100,
    turn: 1,
    activeSide: "player",
    phase: "main",
    player: {
      hero: { defId: "lulu", hp: 80, maxHp: 80, atk: 10, def: 5, cmd: 5, morale: 0, gaugeValue: 0, armor: 0, buffs: [], statusBuffs: [], equipment: {}, flags: { ultimateUsed: false, immortalUsed: false } },
      manaCurrent: 0,
      manaCap: 0,
      manaCapAbsolute: 10,
      tempMana: 0,
      deck: [],
      hand: [],
      graveyard: [],
      troopSlots: [null, null, null, null, null],
      spellsCastThisTurn: 0,
      spellsCastThisGame: 0,
    },
    enemy: {
      hero: { defId: lairId, hp: 100, maxHp: 100, atk: 0, def: 0, cmd: 5, morale: 0, gaugeValue: 0, armor: 0, buffs: [], statusBuffs: [], equipment: {}, flags: { ultimateUsed: true, immortalUsed: false } },
      manaCurrent: 0,
      manaCap: 0,
      manaCapAbsolute: 10,
      tempMana: 0,
      deck: [],
      hand: [],
      graveyard: [],
      troopSlots: [null, null, null, null, null],
      spellsCastThisTurn: 0,
      spellsCastThisGame: 0,
    },
    field: { player: null, enemy: null },
    omen: null,
    stability: 100,
    corruptionStage: 0,
    log: [],
    result: "ongoing",
  };
}

describe("lair field effects", () => {
  ensureScriptedRegistered();
  const ctx = createBattleContext();

  it("activates once at the start of turn 10", () => {
    const state = mkState("insect_hive");
    state.turn = 9;
    startTurnFor(state, "player", ctx);
    expect(state.enemy.hero.flags.lairFieldActive).toBeUndefined();

    state.turn = 10;
    startTurnFor(state, "player", ctx);
    expect(state.enemy.hero.flags.lairFieldActive).toBe(true);
    expect(state.enemy.hero.flags.lairFieldId).toBe("hive_feast");
  });

  it("putrefactive spread drains stability and player units", () => {
    const state = mkState("putrefactive_lair");
    state.turn = 10;
    state.player.troopSlots[0] = freshTroop("T_c_01", "p1");
    const hpBefore = state.player.troopSlots[0]!.hp;

    startTurnFor(state, "player", ctx);

    expect(state.stability).toBe(97);
    expect(state.player.hero.hp).toBe(78);
    expect(state.player.troopSlots[0]!.hp).toBe(hpBefore - 2);
  });

  it("hive feast gives enemy troops ATK and lifesteal, not player", () => {
    const state = mkState("insect_hive");
    state.turn = 10;
    state.player.troopSlots[0] = freshTroop("T_c_01", "p1");
    state.enemy.troopSlots[0] = freshTroop("T_s_08", "e1");
    const playerAtk = state.player.troopSlots[0]!.atk;
    const enemyAtk = state.enemy.troopSlots[0]!.atk;

    startTurnFor(state, "player", ctx);

    expect(state.player.troopSlots[0]!.atk).toBe(playerAtk);
    expect(state.enemy.troopSlots[0]!.atk).toBe(enemyAtk + 3);
    expect(state.player.troopSlots[0]!.keywords.has("lifesteal")).toBe(false);
    expect(state.enemy.troopSlots[0]!.keywords.has("lifesteal")).toBe(true);
  });

  it("moonrise heals only enemy troops at turn end", () => {
    const state = mkState("beast_cave");
    state.enemy.hero.flags.lairFieldActive = true;
    state.enemy.hero.flags.lairFieldId = "moonrise";
    state.player.troopSlots[0] = freshTroop("T_c_01", "p1");
    state.enemy.troopSlots[0] = freshTroop("T_s_12", "e1");
    state.player.troopSlots[0]!.hp -= 5;
    state.enemy.troopSlots[0]!.hp -= 5;

    endTurnFor(state, "player", ctx);

    expect(state.player.troopSlots[0]!.hp).toBe(state.player.troopSlots[0]!.maxHp - 5);
    expect(state.enemy.troopSlots[0]!.hp).toBe(state.enemy.troopSlots[0]!.maxHp - 3);
  });

  it("shadow fog freezes a random troop for the next action window", () => {
    const state = mkState("shadow_gate");
    state.turn = 10;
    state.player.troopSlots[0] = freshTroop("T_c_01", "p1");

    startTurnFor(state, "player", ctx);

    expect(state.player.troopSlots[0]!.frozenTurns).toBeGreaterThan(0);
    expect(state.player.troopSlots[0]!.frozenDisplayName).toBe("冰凍");
  });

  it("crystal cavern gives enemy troops DEF and guard, not player", () => {
    const state = mkState("crystal_vein");
    state.turn = 10;
    state.player.troopSlots[0] = freshTroop("T_c_01", "p1");
    state.enemy.troopSlots[0] = freshTroop("T_s_20", "e1");
    const playerDef = state.player.troopSlots[0]!.def;
    const enemyDef = state.enemy.troopSlots[0]!.def;

    startTurnFor(state, "player", ctx);

    expect(state.player.troopSlots[0]!.def).toBe(playerDef);
    expect(state.enemy.troopSlots[0]!.def).toBe(enemyDef + 2);
    expect(state.player.troopSlots[0]!.keywords.has("guard")).toBe(false);
    expect(state.enemy.troopSlots[0]!.keywords.has("guard")).toBe(true);
  });

  it("corrupted temple summons an extra priest every third enemy turn end", () => {
    const state = mkState("corrupted_temple");
    state.turn = 12;
    state.enemy.hero.flags.lairFieldActive = true;
    state.enemy.hero.flags.lairFieldId = "corrupted_temple";

    endTurnFor(state, "enemy", ctx);

    expect(state.enemy.troopSlots.some((troop) => troop?.cardId === "T_s_24")).toBe(true);
  });
});
