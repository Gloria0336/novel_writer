import type { BattleState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { Side } from "../types/effect";
import type { TroopCard } from "../types/card";
import { rngPick } from "../deck/prng";
import { aliveTroops, freeSlotIndex, getSide } from "../selectors/battle";
import { applyCorruptionStageEffects, applyStabilityDelta } from "../resource/stability";
import { createTroopInstance } from "./factories";
import { notifyBossGauge } from "../resource/bossGauge";

export type LairFieldId =
  | "putrefactive_spread"
  | "hive_feast"
  | "moonrise"
  | "shadow_fog"
  | "crystal_cavern"
  | "corrupted_temple";

interface LairFieldDefinition {
  id: LairFieldId;
  lairId: string;
  name: string;
}

const LAIR_FIELDS: Record<string, LairFieldDefinition> = {
  putrefactive_lair: { id: "putrefactive_spread", lairId: "putrefactive_lair", name: "腐敗蔓延" },
  insect_hive: { id: "hive_feast", lairId: "insect_hive", name: "蟲巢盛宴" },
  beast_cave: { id: "moonrise", lairId: "beast_cave", name: "魔月現世" },
  shadow_gate: { id: "shadow_fog", lairId: "shadow_gate", name: "暗影霧海" },
  crystal_vein: { id: "crystal_cavern", lairId: "crystal_vein", name: "結晶洞穴" },
  corrupted_temple: { id: "corrupted_temple", lairId: "corrupted_temple", name: "腐化神殿" },
};

export function getLairFieldDefinition(lairId: string): LairFieldDefinition | undefined {
  return LAIR_FIELDS[lairId];
}

export function getActiveLairFieldId(state: BattleState): LairFieldId | null {
  const value = state.enemy.hero.flags.lairFieldId;
  if (typeof value !== "string") return null;
  return isLairFieldId(value) ? value : null;
}

export function applyLairFieldOnTurnStart(state: BattleState, ctx: BattleContext, side: Side): void {
  activateLairFieldIfReady(state);
  const fieldId = getActiveLairFieldId(state);
  if (!fieldId) return;

  if (fieldId === "putrefactive_spread") {
    applyPutrefactiveSpread(state, ctx);
  }
  if (fieldId === "shadow_fog") {
    freezeRandomTroop(state, side);
  }
}

export function applyLairFieldOnTurnEnd(state: BattleState, ctx: BattleContext, side: Side): void {
  const fieldId = getActiveLairFieldId(state);
  if (!fieldId) return;

  if (fieldId === "moonrise") {
    healEnemyTroops(state, side, 2);
  }
  if (fieldId === "corrupted_temple" && side === "enemy" && state.turn % 3 === 0) {
    summonExtraPriest(state, ctx);
  }
}

export function addLairFieldTroopAura(state: BattleState, troop: TroopInstance, mod: { atk?: number; def?: number; hp?: number }): void {
  const fieldId = getActiveLairFieldId(state);
  if (fieldId === "hive_feast") {
    mod.atk = (mod.atk ?? 0) + 3;
    troop.keywords.add("lifesteal");
  }
  if (fieldId === "crystal_cavern") {
    mod.def = (mod.def ?? 0) + 2;
    troop.keywords.add("guard");
  }
}

function activateLairFieldIfReady(state: BattleState): void {
  if (state.turn < 10) return;
  if (state.enemy.hero.flags.lairFieldActive === true) return;

  const field = getLairFieldDefinition(state.enemy.hero.defId);
  if (!field) return;

  state.enemy.hero.flags.lairFieldActive = true;
  state.enemy.hero.flags.lairFieldId = field.id;
  state.enemy.hero.flags.lairFieldName = field.name;
  state.enemy.hero.flags.lairFieldAppliedTurn = state.turn;
  state.log.push({
    turn: state.turn,
    side: "enemy",
    kind: "LAIR_FIELD_APPLY",
    text: `Lair field applies: ${field.name}`,
    payload: { lairId: field.lairId, fieldId: field.id, fieldName: field.name },
  });
}

function applyPutrefactiveSpread(state: BattleState, ctx: BattleContext): void {
  const stability = applyStabilityDelta(state, -3, ctx);
  applyCorruptionStageEffects(state, stability.stageJustReached);

  const player = state.player;
  player.hero.hp = Math.max(0, player.hero.hp - 2);
  for (const troop of aliveTroops(player)) {
    troop.hp = Math.max(0, troop.hp - 2);
  }

  state.log.push({
    turn: state.turn,
    side: "enemy",
    kind: "LAIR_FIELD_TICK",
    text: "腐敗蔓延: stability -3, player units HP -2",
    payload: { fieldId: "putrefactive_spread", stabilityDelta: -3, hpLoss: 2 },
  });
}

function freezeRandomTroop(state: BattleState, side: Side): void {
  const targets = [...aliveTroops(state.player)];
  if (targets.length === 0) return;

  const pick = rngPick(state.rngState, targets);
  state.rngState = pick.state;
  const troop = pick.value;
  troop.frozenTurns = Math.max(troop.frozenTurns, 2);
  troop.frozenDisplayName = "冰凍";
  state.log.push({
    turn: state.turn,
    side,
    kind: "LAIR_FIELD_FREEZE",
    text: `暗影霧海: freeze ${troop.cardId}`,
    payload: { fieldId: "shadow_fog", instanceId: troop.instanceId, cardId: troop.cardId },
  });
}

function healEnemyTroops(state: BattleState, side: Side, amount: number): void {
  let healed = 0;
  for (const troop of aliveTroops(state.enemy)) {
    const before = troop.hp;
    troop.hp = Math.min(troop.maxHp, troop.hp + amount);
    healed += troop.hp - before;
  }
  if (healed <= 0) return;
  state.log.push({
    turn: state.turn,
    side,
    kind: "LAIR_FIELD_HEAL",
    text: `魔月現世: enemy troops HP +${amount}`,
    payload: { fieldId: "moonrise", amount, healed },
  });
}

function summonExtraPriest(state: BattleState, ctx: BattleContext): void {
  const enemy = state.enemy;
  const slot = freeSlotIndex(enemy);
  if (slot < 0) return;

  const card = ctx.getCard("T_s_24");
  if (card.type !== "troop") return;

  const priest = createTroopInstance(state, card as TroopCard);
  enemy.troopSlots[slot] = priest;
  notifyBossGauge(state, ctx, { kind: "onSummon", cardId: card.id });
  state.log.push({
    turn: state.turn,
    side: "enemy",
    kind: "LAIR_FIELD_SUMMON",
    text: "腐化神殿: summon extra priest",
    payload: { fieldId: "corrupted_temple", cardId: card.id, instanceId: priest.instanceId, slot },
  });
}

function collectAllTroops(state: BattleState): TroopInstance[] {
  return [...aliveTroops(getSide(state, "player")), ...aliveTroops(getSide(state, "enemy"))];
}

function isLairFieldId(value: string): value is LairFieldId {
  return (
    value === "putrefactive_spread" ||
    value === "hive_feast" ||
    value === "moonrise" ||
    value === "shadow_fog" ||
    value === "crystal_cavern" ||
    value === "corrupted_temple"
  );
}
