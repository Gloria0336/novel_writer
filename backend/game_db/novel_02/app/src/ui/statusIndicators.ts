import type { TroopInstance } from "../core/types/battle";
import type { HeroAbilityFreezeKind, StatModifier } from "../core/types/effect";
import type { ActiveBuff, HeroInstance } from "../core/types/hero";
import { HERO_ABILITY_FREEZE_LABEL } from "../core/effects/heroAbilityFreeze";
import { KEYWORD_LABEL, type Keyword } from "../core/types/keyword";

export type StatusIndicatorOwner = "hero" | "troop";
export type StatusIndicatorTone = "buff" | "debuff" | "mixed" | "control" | "keyword";

export interface StatusIndicator {
  id: string;
  owner: StatusIndicatorOwner;
  tone: StatusIndicatorTone;
  label: string;
  title: string;
  details: string[];
  remainingTurns?: number;
}

export type SourceNameResolver = (source: string) => string | undefined;

const STAT_LABELS: Array<[keyof StatModifier, string]> = [
  ["atk", "ATK"],
  ["def", "DEF"],
  ["hp", "HP"],
  ["cmd", "CMD"],
];

const SYSTEM_SOURCE_LABELS: Record<string, string> = {
  RIFT_BUFF: "裂縫佔據",
  FEY_FORM: "妖精形態",
  FEY_ANCESTOR: "祖靈形態",
  TOTAL_MOBILIZATION: "總動員",
  PRIMAL_AWAKENING: "原始覺醒",
  TAN_FORM_MEMORY: "形態記憶",
  BEAST_HALFHP: "獸王狂暴",
  MOBILIZE: "動員",
};

export function buildHeroStatusIndicators(hero: HeroInstance, resolveSourceName?: SourceNameResolver): StatusIndicator[] {
  const indicators = hero.buffs.map((buff) => buildStatBuffIndicator("hero", buff, resolveSourceName));
  const freezes = hero.flags.heroAbilityFreeze;
  if (freezes) {
    const displayNames = hero.flags.heroAbilityFreezeDisplayNames;
    for (const mode of Object.keys(freezes) as HeroAbilityFreezeKind[]) {
      const turns = freezes[mode] ?? 0;
      if (turns <= 0) continue;
      const displayName = displayNames?.[mode] ?? "封鎖";
      indicators.push({
        id: `hero-freeze-${mode}`,
        owner: "hero",
        tone: "control",
        label: freezeModeShortLabel(mode),
        title: `凍結-${displayName}`,
        details: [
          "來源：控制效果",
          `效果：${displayName}${HERO_ABILITY_FREEZE_LABEL[mode]}（判定：凍結）`,
          `剩餘：${formatRemainingTurns(turns)}`,
        ],
        remainingTurns: turns,
      });
    }
  }
  return indicators;
}

export function buildTroopStatusIndicators(troop: TroopInstance, resolveSourceName?: SourceNameResolver): StatusIndicator[] {
  const indicators = troop.buffs.map((buff) => buildStatBuffIndicator("troop", buff, resolveSourceName));

  for (const buff of troop.keywordBuffs ?? []) {
    const keywordName = keywordLabel(buff.keyword);
    indicators.push({
      id: `troop-keyword-${buff.id}`,
      owner: "troop",
      tone: "keyword",
      label: keywordName,
      title: `暫時關鍵字：${keywordName}`,
      details: [
        `來源：${sourceLabel(buff.source, resolveSourceName)}`,
        `效果：獲得${keywordName}`,
        `剩餘：${formatRemainingTurns(buff.remainingTurns)}`,
      ],
      remainingTurns: buff.remainingTurns,
    });
  }

  if (troop.frozenTurns > 0) {
    const displayName = troop.frozenDisplayName;
    const displayText = effectDisplayText("凍結", displayName);
    indicators.push({
      id: `troop-frozen-${troop.instanceId}`,
      owner: "troop",
      tone: "control",
      label: displayName ?? "凍結",
      title: displayText,
      details: [
        "來源：控制效果",
        `效果：${displayText}，無法攻擊`,
        `剩餘：${formatRemainingTurns(troop.frozenTurns)}`,
      ],
      remainingTurns: troop.frozenTurns,
    });
  }

  return indicators;
}

export function formatRemainingTurns(turns: number): string {
  if (!Number.isFinite(turns)) return "持續";
  if (turns >= 999) return "持續";
  if (turns <= 1) return "本回合";
  return `${turns} 回合`;
}

function buildStatBuffIndicator(owner: StatusIndicatorOwner, buff: ActiveBuff, resolveSourceName?: SourceNameResolver): StatusIndicator {
  const parts = statParts(buff.mod);
  const tone = statTone(buff.mod);
  const title = statTitle(parts, tone);
  return {
    id: `${owner}-stat-${buff.id}`,
    owner,
    tone,
    label: parts.map((part) => `${part.label}${signed(part.value)}`).join(" "),
    title,
    details: [
      `來源：${sourceLabel(buff.source, resolveSourceName)}`,
      `效果：${parts.map((part) => `${part.label} ${signed(part.value)}`).join(" / ")}`,
      `剩餘：${formatRemainingTurns(buff.remainingTurns)}`,
    ],
    remainingTurns: buff.remainingTurns,
  };
}

function buildStatusIndicator(owner: StatusIndicatorOwner, buff: { id: string; source: string; status: string; remainingTurns: number }, resolveSourceName?: SourceNameResolver): StatusIndicator {
  const label = buff.status;
  return {
    id: `${owner}-status-${buff.id}`,
    owner,
    tone: buff.status === "marked" || buff.status === "untargetable" ? "control" : "keyword",
    label,
    title: label,
    details: [
      `靘?嚗?{sourceLabel(buff.source, resolveSourceName)}`,
      `??嚗?{label}`,
      `?拚?嚗?{formatRemainingTurns(buff.remainingTurns)}`,
    ],
    remainingTurns: buff.remainingTurns,
  };
}

function statParts(mod: StatModifier): Array<{ key: keyof StatModifier; label: string; value: number }> {
  return STAT_LABELS.flatMap(([key, label]) => {
    const value = mod[key];
    return typeof value === "number" && value !== 0 ? [{ key, label, value }] : [];
  });
}

function statTone(mod: StatModifier): StatusIndicatorTone {
  const values = statParts(mod).map((part) => part.value);
  if (values.length === 0) return "mixed";
  if (values.every((value) => value > 0)) return "buff";
  if (values.every((value) => value < 0)) return "debuff";
  return "mixed";
}

function statTitle(parts: Array<{ key: keyof StatModifier; label: string; value: number }>, tone: StatusIndicatorTone): string {
  if (parts.length === 1) {
    if (tone === "buff") return `${parts[0]!.label}提升`;
    if (tone === "debuff") return `${parts[0]!.label}降低`;
  }
  if (tone === "buff") return "能力提升";
  if (tone === "debuff") return "能力降低";
  return "能力調整";
}

function sourceLabel(source: string, resolveSourceName?: SourceNameResolver): string {
  const resolved = resolveSourceName?.(source);
  if (resolved) return resolved;
  if (source.startsWith("FULL_GAUGE_BUFF")) return "滿量表加成";
  return SYSTEM_SOURCE_LABELS[source] ?? source;
}

function keywordLabel(keyword: Keyword): string {
  return KEYWORD_LABEL[keyword] || keyword;
}

function freezeModeShortLabel(mode: HeroAbilityFreezeKind): string {
  const map: Record<HeroAbilityFreezeKind, string> = {
    action: "行動",
    spell: "法術",
    troop: "兵力",
    manaRegen: "魔力",
  };
  return map[mode];
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function effectDisplayText(family: string, displayName: string | undefined): string {
  return displayName ? `${family}-${displayName}` : family;
}
