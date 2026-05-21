import type { BattleState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { DamageOptions, DamageResult } from "../combat/damage";
import type { Side } from "../types/effect";
import { applyHeroDamage, applyTroopDamage } from "../combat/damage";
import { aliveTroops, getSide } from "../selectors/battle";
import { spendGauge } from "../resource/gauge";
import { syncFullGaugeBuffs } from "../resource/fullGaugeBuff";
import { sideHasEquipmentPassive, troopHasPassiveTag } from "./passiveTags";

export type PassiveDamageSource = "troop" | "spell" | "action" | "equipment" | "field" | "skill" | "ultimate" | "passive";

export interface PassiveDamageOptions extends DamageOptions {
  sourceKind?: PassiveDamageSource;
  damageFamily?: "fire" | "normal";
}

export function applyHeroDamageWithPassives(
  state: BattleState,
  ctx: BattleContext,
  sourceSide: Side,
  targetSide: Side,
  raw: number,
  opts: PassiveDamageOptions = {},
): DamageResult {
  const defender = getSide(state, targetSide);
  let amount = Math.max(0, raw);
  const beforeHp = defender.hero.hp;

  if (sideHasEquipmentPassive(ctx, defender, "DEF_THRESHOLD_IMMUNE") && amount < defender.hero.def) {
    amount = 0;
  }

  if (amount > 0 && opts.sourceKind === "action") {
    const absorber = aliveTroops(defender).find((troop) => troopHasPassiveTag(ctx, troop, "ABSORB_HALF_HERO_ACTION_DAMAGE"));
    if (absorber) {
      const absorbed = Math.ceil(amount / 2);
      applyTroopDamage(absorber, absorbed, { fixed: true });
      amount -= absorbed;
    }
  }

  if (amount > 0) {
    const proxy = aliveTroops(defender).find((troop) => troopHasPassiveTag(ctx, troop, "G_FOLLOWER_PROXY"));
    if (proxy) {
      const absorbed = Math.min(5, amount);
      applyTroopDamage(proxy, absorbed, { fixed: true });
      amount -= absorbed;
    }
  }

  let result = applyHeroDamage(defender.hero, amount, opts);

  if (result.finalAmount > 0 && sideHasEquipmentPassive(ctx, defender, "B_BATTLE_SCAR_MEDAL")) {
    const step = defender.hero.maxHp * 0.1;
    if (step > 0) {
      const prevSteps = Math.floor((defender.hero.maxHp - beforeHp) / step);
      const nextSteps = Math.floor((defender.hero.maxHp - defender.hero.hp) / step);
      const crossed = Math.max(0, nextSteps - prevSteps);
      if (crossed > 0) defender.hero.atk += crossed;
    }
  }

  if (defender.hero.hp <= 0 && sideHasEquipmentPassive(ctx, defender, "MOON_RELIC") && spendGauge(defender.hero, 50)) {
    defender.hero.hp = 1;
    syncFullGaugeBuffs(state, ctx);
    result = { ...result, killed: false };
  }

  return result;
}

export function applyTroopDamageWithPassives(
  state: BattleState,
  ctx: BattleContext,
  targetSide: Side,
  troop: TroopInstance,
  raw: number,
  opts: PassiveDamageOptions = {},
): DamageResult {
  if (opts.damageFamily === "fire" && troopHasPassiveTag(ctx, troop, "DM_FLAME_IMMUNE")) {
    return { finalAmount: 0, killed: false };
  }

  if (opts.sourceKind === "spell" && (troopHasPassiveTag(ctx, troop, "IMMUNE_SPELL_DAMAGE") || troopHasPassiveTag(ctx, troop, "DM_DOOM_GIANT_SPELL_IMMUNE"))) {
    return { finalAmount: 0, killed: false };
  }

  let amount = raw;
  if (opts.sourceKind === "spell" && troopHasPassiveTag(ctx, troop, "Y_SERPENT_GUARD")) {
    const form = getSide(state, targetSide).hero.flags.feyForm ?? "human";
    if (form !== "fey") amount = Math.ceil(amount * 0.5);
  }

  const contract = findEternalContractPeer(state, troop);
  if (contract && amount > 0) {
    const shared = Math.floor(amount / 2);
    const result = applyTroopDamage(troop, shared, opts);
    applyTroopDamage(contract.peer, shared, opts);
    state.log.push({
      turn: state.turn,
      side: contract.ownerSide,
      kind: "ETERNAL_CONTRACT_SHARE",
      text: `永恆契約：${troop.cardId} 與 ${contract.peer.cardId} 各承受 ${shared} 傷害`,
      payload: { target: troop.instanceId, peer: contract.peer.instanceId, amount: shared },
    });
    return result;
  }

  return applyTroopDamage(troop, amount, opts);
}

function findEternalContractPeer(state: BattleState, troop: TroopInstance): { ownerSide: Side; peer: TroopInstance } | null {
  for (const ownerSide of ["player", "enemy"] as const) {
    const flags = getSide(state, ownerSide).hero.flags;
    if (flags.eternalContractActive !== true) continue;
    const a = flags.eternalContractA as string | undefined;
    const b = flags.eternalContractB as string | undefined;
    if (!a || !b) continue;
    const peerId = troop.instanceId === a ? b : troop.instanceId === b ? a : undefined;
    if (!peerId) continue;
    const peer = [...aliveTroops(state.player), ...aliveTroops(state.enemy)].find((candidate) => candidate.instanceId === peerId && candidate.hp > 0);
    if (!peer) {
      flags.eternalContractActive = false;
      delete flags.eternalContractA;
      delete flags.eternalContractB;
      return null;
    }
    return { ownerSide, peer };
  }
  return null;
}
