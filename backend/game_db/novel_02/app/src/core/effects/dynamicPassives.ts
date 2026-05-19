import type { BattleState, SideState, TroopInstance } from "../types/battle";
import type { BattleContext } from "../types/context";
import type { Side, StatModifier } from "../types/effect";
import type { HeroInstance } from "../types/hero";
import { aliveTroops, getSide, otherSide } from "../selectors/battle";
import { equippedCount, sideHasEquipmentPassive, troopHasPassiveTag } from "./passiveTags";

const DYNAMIC_SOURCE = "DYNAMIC_PASSIVE";

export function isDynamicPassiveSource(source: string): boolean {
  return source.startsWith(DYNAMIC_SOURCE);
}

export function syncDynamicPassiveAuras(state: BattleState, ctx: BattleContext): void {
  clearSideDynamicAuras(state.player);
  clearSideDynamicAuras(state.enemy);

  syncTroopAuras(state, ctx, "player");
  syncTroopAuras(state, ctx, "enemy");
  syncHeroAuras(state, ctx, "player");
  syncHeroAuras(state, ctx, "enemy");
}

function clearSideDynamicAuras(side: SideState): void {
  clearHeroDynamicAuras(side.hero);
  for (const troop of aliveTroops(side)) clearTroopDynamicAuras(troop);
}

function clearTroopDynamicAuras(troop: TroopInstance): void {
  const kept = [];
  for (const buff of troop.buffs) {
    if (!isDynamicPassiveSource(buff.source)) {
      kept.push(buff);
      continue;
    }
    removeTroopMod(troop, buff.mod);
  }
  troop.buffs = kept;
}

function clearHeroDynamicAuras(hero: HeroInstance): void {
  const kept = [];
  for (const buff of hero.buffs) {
    if (!isDynamicPassiveSource(buff.source)) {
      kept.push(buff);
      continue;
    }
    removeHeroMod(hero, buff.mod);
  }
  hero.buffs = kept;
}

function syncTroopAuras(state: BattleState, ctx: BattleContext, side: Side): void {
  const sideState = getSide(state, side);
  const troops = aliveTroops(sideState);
  const equipped = equippedCount(sideState);
  const feyForm = sideState.hero.flags.feyForm ?? "human";
  const cursedByEnemy = aliveTroops(getSide(state, otherSide(side))).some((troop) => troopHasPassiveTag(ctx, troop, "DM_CURSE_GENERAL_AURA"));

  for (const troop of troops) {
    const mod: StatModifier = {};
    if (troopHasPassiveTag(ctx, troop, "ATK_PER_ALLY")) {
      mod.atk = (mod.atk ?? 0) + Math.max(0, troops.length - 1);
    }
    if (troopHasPassiveTag(ctx, troop, "MOUNTAIN_KING_GUARD")) {
      mod.def = (mod.def ?? 0) + equipped;
    }
    if (troopHasPassiveTag(ctx, troop, "Y_SERPENT_GUARD") && feyForm === "fey") {
      mod.atk = (mod.atk ?? 0) + 4;
    }
    if (cursedByEnemy) {
      mod.atk = (mod.atk ?? 0) - 2;
      mod.def = (mod.def ?? 0) - 2;
    }
    addTroopDynamicBuff(troop, "troop", mod);
  }
}

function syncHeroAuras(state: BattleState, ctx: BattleContext, side: Side): void {
  const sideState = getSide(state, side);
  const troops = aliveTroops(sideState);
  const mod: StatModifier = {};

  const towerCount = troops.filter((troop) => troopHasPassiveTag(ctx, troop, "HERO_DEF_PLUS_2_WHILE_ALIVE")).length;
  if (towerCount > 0) mod.def = (mod.def ?? 0) + towerCount * 2;

  if (sideHasEquipmentPassive(ctx, sideState, "CLAN_WARHAMMER")) {
    const devices = troops.filter((troop) => troop.isDevice === true).length;
    if (devices > 0) mod.atk = (mod.atk ?? 0) + devices * 2;
  }

  addHeroDynamicBuff(sideState.hero, "hero", mod);
}

function addTroopDynamicBuff(troop: TroopInstance, sourceKey: string, mod: StatModifier): void {
  if (!hasAnyMod(mod)) return;
  troop.atk += mod.atk ?? 0;
  troop.def += mod.def ?? 0;
  if (mod.hp) {
    troop.maxHp += mod.hp;
    troop.hp += mod.hp;
  }
  troop.buffs.push({ id: `${DYNAMIC_SOURCE}:${sourceKey}:${troop.instanceId}`, source: `${DYNAMIC_SOURCE}:${sourceKey}`, mod, remainingTurns: Number.MAX_SAFE_INTEGER });
}

function addHeroDynamicBuff(hero: HeroInstance, sourceKey: string, mod: StatModifier): void {
  if (!hasAnyMod(mod)) return;
  hero.atk += mod.atk ?? 0;
  hero.def += mod.def ?? 0;
  if (mod.cmd) hero.cmd += mod.cmd;
  if (mod.hp) {
    hero.maxHp += mod.hp;
    hero.hp += mod.hp;
  }
  hero.buffs.push({ id: `${DYNAMIC_SOURCE}:${sourceKey}`, source: `${DYNAMIC_SOURCE}:${sourceKey}`, mod, remainingTurns: Number.MAX_SAFE_INTEGER });
}

function hasAnyMod(mod: StatModifier): boolean {
  return Boolean(mod.atk || mod.def || mod.hp || mod.cmd);
}

function removeTroopMod(troop: TroopInstance, mod: StatModifier): void {
  troop.atk -= mod.atk ?? 0;
  troop.def -= mod.def ?? 0;
  if (mod.hp) {
    troop.maxHp = Math.max(1, troop.maxHp - mod.hp);
    troop.hp = Math.min(troop.maxHp, Math.max(1, troop.hp - mod.hp));
  }
}

function removeHeroMod(hero: HeroInstance, mod: StatModifier): void {
  hero.atk -= mod.atk ?? 0;
  hero.def -= mod.def ?? 0;
  hero.cmd -= mod.cmd ?? 0;
  if (mod.hp) {
    hero.maxHp = Math.max(1, hero.maxHp - mod.hp);
    hero.hp = Math.min(hero.maxHp, Math.max(1, hero.hp - mod.hp));
  }
}
