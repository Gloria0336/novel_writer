import type { BattleState } from "../types/battle";
import type { BattleContext } from "../types/context";
import { executeEffects } from "../effects/registry";

/**
 * §E.2 巢穴光環 / 節奏觸發：在敵方回合 start / end 時跑 enemy 的 auraTags。
 * 透過 enemyResolver 取得目前敵人的 auraTags（避免循環依賴 — 由 caller 傳入）。
 */
export type AuraResolver = (defId: string) => { onStart?: string[]; onEnd?: string[] } | undefined;

export function runLairAuras(
  state: BattleState,
  ctx: BattleContext,
  phase: "start" | "end",
  resolver: AuraResolver,
): void {
  const aura = resolver(state.enemy.hero.defId);
  if (!aura) return;
  const tags = phase === "start" ? aura.onStart : aura.onEnd;
  if (!tags || tags.length === 0) return;
  for (const tag of tags) {
    executeEffects(
      [{ kind: "scripted", tag }],
      { state, ctx, sourceSide: "enemy", sourceKind: "passive" },
    );
    if (state.result !== "ongoing") return;
  }
}
