import { describe, expect, it } from "vitest";
import { getCard } from "../../data/cards";
import { applyPlayerActionWithTimeline, createBattle, createBattleContext } from "../../game/seed";
import type { BattleState, TroopInstance } from "../types/battle";
import type { BattleVisualEvent } from "../types/visual";
import { applyActionWithTimeline } from "./timeline";

const ctx = createBattleContext();

function makeState(): BattleState {
  const state = createBattle({ seed: 7, playerHeroId: "lulu", playerDeckIds: [], initialHand: 0 });
  state.phase = "main";
  state.player.manaCap = 10;
  state.player.manaCurrent = 10;
  state.enemy.hero.def = 0;
  return state;
}

function mkTroop(cardId: string, instanceId: string): TroopInstance {
  const card = getCard(cardId);
  if (card.type !== "troop" && card.type !== "device") throw new Error(`${cardId} is not a unit card`);
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
  };
}

function timelineEvents<T extends BattleVisualEvent["type"]>(
  timeline: ReturnType<typeof applyActionWithTimeline>["timeline"],
  type: T,
): Array<Extract<BattleVisualEvent, { type: T }>> {
  return timeline.flatMap((step) => step.events.filter((event): event is Extract<BattleVisualEvent, { type: T }> => event.type === type));
}

describe("battle visual timeline", () => {
  it("plays a card move before a single-target spell damage snapshot", () => {
    const state = makeState();
    state.player.hand = [{ instanceId: "spell_ray", cardId: "S_c_12" }];
    const beforeHp = state.enemy.hero.hp;

    const result = applyActionWithTimeline(state, { type: "PLAY_SPELL", handIndex: 0, targetInstanceId: "H_enemy" }, ctx);

    expect(result.ok).toBe(true);
    const moveIndex = result.timeline.findIndex((step) => step.events.some((event) => event.type === "cardMove"));
    const damageIndex = result.timeline.findIndex((step) => step.events.some((event) => event.type === "damage"));
    expect(moveIndex).toBeGreaterThanOrEqual(0);
    expect(damageIndex).toBeGreaterThan(moveIndex);

    const damage = timelineEvents(result.timeline, "damage").find((event) => event.target.kind === "hero" && event.target.side === "enemy");
    expect(damage?.previousHp).toBe(beforeHp);
    expect(damage?.newHp).toBeLessThan(beforeHp);
    expect(result.timeline[damageIndex]?.stateSnapshot.enemy.hero.hp).toBe(damage?.newHp);
  });

  it("keeps all-target troop damage in target resolution order", () => {
    const state = makeState();
    state.player.hand = [{ instanceId: "nova", cardId: "S_c_07" }];
    state.enemy.troopSlots[0] = mkTroop("T_c_01", "enemy_a");
    state.enemy.troopSlots[1] = mkTroop("T_c_02", "enemy_b");

    const result = applyActionWithTimeline(state, { type: "PLAY_SPELL", handIndex: 0 }, ctx);

    expect(result.ok).toBe(true);
    const damageTargets = timelineEvents(result.timeline, "damage")
      .filter((event) => event.target.kind === "troopSlot")
      .map((event) => event.target.kind === "troopSlot" ? event.target.slotIndex : -1);
    expect(damageTargets.slice(0, 2)).toEqual([0, 1]);
  });

  it("splits troop combat into attacker damage then counter damage", () => {
    const state = makeState();
    state.player.troopSlots[0] = mkTroop("T_c_02", "attacker");
    state.enemy.troopSlots[0] = mkTroop("T_c_02", "defender");

    const result = applyActionWithTimeline(state, { type: "TROOP_ATTACK", attackerInstanceId: "attacker", targetInstanceId: "defender" }, ctx);

    expect(result.ok).toBe(true);
    const damageSteps = result.timeline.filter((step) => step.events.some((event) => event.type === "damage"));
    expect(damageSteps.length).toBeGreaterThanOrEqual(2);
    const firstDamage = damageSteps[0]!.events.find((event): event is Extract<BattleVisualEvent, { type: "damage" }> => event.type === "damage");
    const secondDamage = damageSteps[1]!.events.find((event): event is Extract<BattleVisualEvent, { type: "damage" }> => event.type === "damage");
    expect(firstDamage?.targetInstanceId).toBe("defender");
    expect(secondDamage?.targetInstanceId).toBe("attacker");
    expect(damageSteps[0]!.stateSnapshot.enemy.troopSlots[0]?.hp).toBe(firstDamage?.newHp);
    expect(damageSteps[0]!.stateSnapshot.player.troopSlots[0]?.hp).toBe(firstDamage ? firstDamage.previousHp : undefined);
  });

  it("records deployment as hand-to-slot card flight", () => {
    const state = makeState();
    state.player.hand = [{ instanceId: "soldier_card", cardId: "T_c_01" }];

    const result = applyActionWithTimeline(state, { type: "PLAY_TROOP", handIndex: 0, slotIndex: 0 }, ctx);

    expect(result.ok).toBe(true);
    const move = timelineEvents(result.timeline, "cardMove")[0];
    expect(move).toMatchObject({
      cardId: "T_c_01",
      cardInstanceId: "soldier_card",
      from: { kind: "hand", side: "player" },
      to: { kind: "troopSlot", side: "player", slotIndex: 0 },
    });
  });

  it("places destroy events after lethal damage", () => {
    const state = makeState();
    state.player.hand = [{ instanceId: "nova", cardId: "S_c_07" }];
    state.enemy.troopSlots[0] = mkTroop("T_c_01", "doomed");

    const result = applyActionWithTimeline(state, { type: "PLAY_SPELL", handIndex: 0 }, ctx);

    expect(result.ok).toBe(true);
    const damageIndex = result.timeline.findIndex((step) => step.events.some((event) => event.type === "damage" && event.targetInstanceId === "doomed"));
    const destroyIndex = result.timeline.findIndex((step) => step.events.some((event) => event.type === "destroy" && event.instanceId === "doomed"));
    expect(damageIndex).toBeGreaterThanOrEqual(0);
    expect(destroyIndex).toBeGreaterThan(damageIndex);
  });

  it("runs END_TURN through the timeline and returns control to the player", () => {
    const state = makeState();

    const result = applyPlayerActionWithTimeline(state, { type: "END_TURN" }, ctx);

    expect(result.ok).toBe(true);
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.timeline.some((step) => step.events.some((event) => event.type === "log" && event.kind === "TURN_END"))).toBe(true);
    expect(state.activeSide).toBe("player");
    expect(state.result).toBe("ongoing");
  });

  it("leaves state.log cleanly structuredClone-able after a timeline run", () => {
    const state = makeState();
    state.player.hand = [{ instanceId: "soldier_card", cardId: "T_c_01" }];

    const result = applyActionWithTimeline(state, { type: "PLAY_TROOP", handIndex: 0, slotIndex: 0 }, ctx);
    expect(result.ok).toBe(true);

    // Regression: the timeline runner used to leave `state.log.push` as an own
    // function property after restoring it, which broke later structuredClone calls
    // (BattleProvider clones settled state on every dispatch).
    expect(Object.prototype.hasOwnProperty.call(state.log, "push")).toBe(false);
    expect(() => structuredClone(state)).not.toThrow();

    // And a follow-up timeline action on the same state should still work.
    state.player.hand = [{ instanceId: "soldier_card_2", cardId: "T_c_01" }];
    const second = applyActionWithTimeline(state, { type: "PLAY_TROOP", handIndex: 0, slotIndex: 1 }, ctx);
    expect(second.ok).toBe(true);
    expect(() => structuredClone(state)).not.toThrow();
  });
});
