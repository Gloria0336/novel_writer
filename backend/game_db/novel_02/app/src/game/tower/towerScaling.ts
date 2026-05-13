import type { HeroInstance } from "../../core/types/hero";
import type { EnemyScale } from "../seed";
import type { OmenId, FloorEntry } from "./types";
import { OMEN_LIST } from "./towerData";
import { nextRng, rngPick } from "../../core/deck/prng";

/** 樓層 → 敵人放大係數。Boss 樓層額外 HP +10%。 */
export function scaleForFloor(entry: FloorEntry): EnemyScale {
  const f = entry.floor;
  const baseHp = 1 + 0.04 * (f - 1);
  const baseAtk = 1 + 0.025 * (f - 1);
  const hpMult = entry.kind === "boss" ? baseHp * 1.1 : baseHp;
  return { hpMult, atkMult: baseAtk };
}

/** 選擇本層天象事件。Boss 樓 100% 觸發；其餘 50% 機率。 */
export function pickOmen(rngState: number, entry: FloorEntry): { omen: OmenId | null; nextRngState: number } {
  const trigger = entry.kind === "boss";
  if (!trigger) {
    const r = nextRng(rngState);
    if (r.value >= 0.5) return { omen: null, nextRngState: r.state };
    rngState = r.state;
  }
  const picked = rngPick(rngState, OMEN_LIST);
  return { omen: picked.value, nextRngState: picked.state };
}

/** 在敵人 instance 上套用樓層縮放（給 createBattle 使用前的替代路徑）。 */
export function applyScaleToInstance(inst: HeroInstance, scale: EnemyScale): HeroInstance {
  return {
    ...inst,
    maxHp: Math.max(1, Math.round(inst.maxHp * scale.hpMult)),
    hp: Math.max(1, Math.round(inst.hp * scale.hpMult)),
    atk: Math.max(0, Math.round(inst.atk * scale.atkMult)),
  };
}
