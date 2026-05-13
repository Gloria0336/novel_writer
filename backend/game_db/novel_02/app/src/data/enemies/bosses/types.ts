import type { Effect } from "../../../core/types/effect";
import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";
import type { TroopCard } from "../../../core/types/card";

/**
 * Boss 定義 — §E.1 鏡像模式專用敵人。
 * Boss 使用完整三層英雄系統（種族+職業+個體技能）。
 * v1 不實作多階段，但保留 `phases` 欄位以便未來擴充。
 */
export interface BossPhaseSpec {
  index: 0 | 1 | 2;
  hpFractionFloor: number;
  onEnter?: Effect[];
  abilitiesUnlocked?: string[];
}

export interface BossDefinition {
  id: string;
  name: string;
  heroDef: HeroDefinition;
  createInstance: () => HeroInstance;
  profileId: string;
  /** 戰鬥開始時觸發的 Effect 列表（如炎魔自動掛獄火場地）。 */
  onBattleStart?: Effect[];
  /** Boss 專屬召喚池（用於 deployFromPool 行為）。 */
  internalTroops?: TroopCard[];
  /** 階段定義 — v1 僅 phase 0。 */
  phases?: BossPhaseSpec[];
  description: string;
}
