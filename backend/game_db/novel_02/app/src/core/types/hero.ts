import type { Effect, FreezeEffectName, HeroAbilityFreezeKind, StatModifier } from "./effect";
import type { ClassKeyword } from "./keyword";
import type { ActiveStatusBuff } from "./status";

export type RaceId = "human" | "elf" | "dwarf" | "fey" | "beast" | "demigod" | "demon";
export type ClassId = "commander" | "mage" | "smith" | "illusionist" | "berserker" | "priest" | "adventurer";
export type HeroRarity = "R" | "SR" | "SSR";

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  cmd: number;
}

export type GaugeId = "command" | "resonance" | "forge" | "essence" | "rage" | "divineEcho" | "darkErosion";

export interface GaugeFrame {
  id: GaugeId;
  name: string;
  max: number;
  description: string;
}

export type FullGaugeBuffRule =
  | { kind: "troopAura"; atk?: number; def?: number }
  | { kind: "turnStartTempMana"; amount: number }
  | { kind: "cardCostReduction"; cardTypes: Array<"equipment" | "device">; amount: number; minCost: number }
  | { kind: "deviceAura"; def?: number }
  | { kind: "feyForm"; humanSpellEffectPct: number; feyActionDamagePct: number; feyAttackDamagePct: number; feyDef: number }
  | { kind: "actionDamagePct"; pct: number }
  | { kind: "healHeroOnKillTroop"; amount: number }
  | { kind: "heroDamageTakenPct"; pct: number }
  | { kind: "troopDamagePct"; pct: number }
  | { kind: "turnStartTroopHeal"; amount: number };

export interface FullGaugeBuffFrame {
  id: string;
  name: string;
  description: string;
  rules: FullGaugeBuffRule[];
}

export interface DeckLimits {
  troop: [number, number];
  action: [number, number];
  spell: [number, number];
  equipment: [number, number];
  field: [number, number];
}

export interface RaceFrame {
  id: RaceId;
  name: string;
  statMods: Stats;
  gauge: GaugeFrame;
  fullGaugeBuff: FullGaugeBuffFrame;
  deckLimits: DeckLimits;
  manaCap?: number;
  description: string;
}

export interface ClassFrame {
  id: ClassId;
  name: string;
  statMods: Stats;
  keyword: ClassKeyword;
  description: string;
}

export interface SkillCost {
  morale?: number;
  gauge?: number;
  mana?: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  cost: SkillCost;
  passive?: boolean;
  effects: Effect[];
}

export interface GaugePersonalization {
  name?: string;
  description: string;
  onTroopEnter?: number;
  onTroopSurvivePerTurn?: number;
  onTroopDestroyedSelf?: number;
  onTroopDestroyedAlly?: number;
  onSpellCast?: number;
  onEquipmentPlay?: number;
  onTurnStart?: number;
  onHeroDamaged?: { perPct: number; perValue: number };
  onForge?: number;
  thresholdEffects?: Array<{ at: number; effect: Effect; once?: boolean }>;
}

export interface HeroDefinition {
  id: string;
  name: string;
  raceId: RaceId;
  classId: ClassId;
  rarity: HeroRarity;
  statTuning: StatModifier;
  gauge: GaugePersonalization;
  passives: Skill[];
  actives: Skill[];
  ultimate: Skill;
  flavor?: string;
}

export interface ActiveBuff {
  id: string;
  source: string;
  mod: StatModifier;
  remainingTurns: number;
}

export type FeyForm = "human" | "fey";

export interface HeroInstance {
  defId: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  cmd: number;
  morale: number;
  gaugeValue: number;
  armor: number;
  buffs: ActiveBuff[];
  statusBuffs?: ActiveStatusBuff[];
  equipment: { weapon?: string; armor?: string; trinket?: string };
  flags: {
    ultimateUsed: boolean;
    immortalUsed: boolean;
    /** 妖族形態：人形 / 妖形 */
    feyForm?: FeyForm;
    /** 半神族「透支」累積層數 */
    overdraft?: number;
    /** 末日倒數剩餘回合（N06） */
    doomsdayCountdown?: number;
    /** 英雄能力凍結：行動牌 / 法術牌 / 兵力牌 / 魔力回復剩餘回合。 */
    heroAbilityFreeze?: Partial<Record<HeroAbilityFreezeKind, number>>;
    /** 英雄能力凍結的呈現子分類；判定仍依 heroAbilityFreeze。 */
    heroAbilityFreezeDisplayNames?: Partial<Record<HeroAbilityFreezeKind, FreezeEffectName>>;
    /** 額外標記 */
    [key: string]: unknown;
  };
}
