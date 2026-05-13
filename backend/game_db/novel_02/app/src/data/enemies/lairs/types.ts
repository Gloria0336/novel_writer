import type { TroopCard } from "../../../core/types/card";
import type { HeroDefinition, HeroInstance } from "../../../core/types/hero";

/**
 * 巢穴定義 — §E.2 攻城模式專用敵人。
 * 不使用三層英雄系統的技能組，HeroDefinition 僅作為型別填充。
 */
export interface LairDefinition {
  id: string;
  name: string;
  heroDef: HeroDefinition;
  createInstance: () => HeroInstance;
  profileId: string;
  /** 巢穴專屬召喚池兵力卡 — 不在玩家牌組中。 */
  internalTroops: TroopCard[];
  /** 巢穴專屬的「光環/節奏」scripted tag，於敵方回合 start/end 時觸發。 */
  auraTags?: { onStart?: string[]; onEnd?: string[] };
  description: string;
}
