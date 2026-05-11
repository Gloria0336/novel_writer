import type { BattleState, TroopInstance } from "../types/battle";
import type { TargetSelector, TargetFilter, Side } from "../types/effect";
import type { HeroInstance } from "../types/hero";
import { aliveTroops, getSide, otherSide } from "../selectors/battle";

export interface ResolvedTarget {
  kind: "hero" | "troop";
  side: Side;
  hero?: HeroInstance;
  troop?: TroopInstance;
}

function matchesFilter(target: ResolvedTarget, filter: TargetFilter, sourceSide: Side): boolean {
  if (filter.side === "self") {
    if (target.side !== sourceSide) return false;
  } else if (filter.side === "player" || filter.side === "enemy") {
    if (target.side !== filter.side) return false;
  } else if (filter.side === "all") {
    // any side
  }
  if (filter.entity && filter.entity !== "any") {
    if (target.kind !== filter.entity) return false;
  }
  if (filter.keyword && target.troop) {
    if (!target.troop.keywords.has(filter.keyword)) return false;
  }
  if (target.troop && filter.minHpPct !== undefined) {
    const pct = (target.troop.hp / target.troop.maxHp) * 100;
    if (pct < filter.minHpPct) return false;
  }
  if (target.troop && filter.maxHpPct !== undefined) {
    const pct = (target.troop.hp / target.troop.maxHp) * 100;
    if (pct > filter.maxHpPct) return false;
  }
  return true;
}

function allEntities(state: BattleState, sideFilter: TargetFilter["side"], sourceSide: Side): ResolvedTarget[] {
  const out: ResolvedTarget[] = [];
  const sides: Side[] =
    sideFilter === "self" ? [sourceSide]
    : sideFilter === "player" ? ["player"]
    : sideFilter === "enemy" ? ["enemy"]
    : ["player", "enemy"];
  for (const side of sides) {
    const s = getSide(state, side);
    out.push({ kind: "hero", side, hero: s.hero });
    for (const t of aliveTroops(s)) out.push({ kind: "troop", side, troop: t });
  }
  return out;
}

/**
 * 將 TargetSelector 解析為實體目標列表。
 * - "single" 需提供 pickedInstanceId（玩家選或 AI 挑）
 * - "self" / "playerHero" / "enemyHero" 直接決定
 * - "all" 取所有符合 filter 的實體
 * - "random" 暫不在此處理（reducer 處理 PRNG）
 */
export function resolveTargets(state: BattleState, selector: TargetSelector, sourceSide: Side): ResolvedTarget[] {
  switch (selector.kind) {
    case "self":
      return [{ kind: "hero", side: sourceSide, hero: getSide(state, sourceSide).hero }];
    case "playerHero":
      return [{ kind: "hero", side: "player", hero: state.player.hero }];
    case "enemyHero":
      return [{ kind: "hero", side: "enemy", hero: state.enemy.hero }];
    case "single": {
      if (!selector.pickedInstanceId) return [];
      // 兵力
      for (const side of ["player", "enemy"] as const) {
        const s = getSide(state, side);
        for (const t of s.troopSlots) {
          if (t && t.instanceId === selector.pickedInstanceId) {
            const target: ResolvedTarget = { kind: "troop", side, troop: t };
            if (!matchesFilter(target, selector.filter, sourceSide)) return [];
            return [target];
          }
        }
      }
      // 英雄
      const playerHeroId = `H_player`;
      const enemyHeroId = `H_enemy`;
      if (selector.pickedInstanceId === playerHeroId) {
        const target: ResolvedTarget = { kind: "hero", side: "player", hero: state.player.hero };
        if (!matchesFilter(target, selector.filter, sourceSide)) return [];
        return [target];
      }
      if (selector.pickedInstanceId === enemyHeroId) {
        const target: ResolvedTarget = { kind: "hero", side: "enemy", hero: state.enemy.hero };
        if (!matchesFilter(target, selector.filter, sourceSide)) return [];
        return [target];
      }
      return [];
    }
    case "all": {
      return allEntities(state, selector.filter.side, sourceSide).filter((t) => matchesFilter(t, selector.filter, sourceSide));
    }
    case "random": {
      const pool = allEntities(state, selector.filter.side, sourceSide).filter((t) => matchesFilter(t, selector.filter, sourceSide));
      // PRNG 由 reducer 處理；這裡回傳全部，呼叫端切片
      return pool.slice(0, selector.count);
    }
  }
}

export const HERO_TARGET_ID = {
  player: "H_player",
  enemy: "H_enemy",
} as const;
