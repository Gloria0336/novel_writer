import { ALL_CARDS, ENEMY_INTERNAL_CARDS, GENERIC_CARDS, NEUTRAL_CARDS, RACE_CARDS } from "../data/cards";
import { CLASSES } from "../data/classes";
import { HERO_LIST } from "../data/heroes";
import { RACES } from "../data/races";
import type { Card, CardType, EquipmentCard, Rarity, TroopCard } from "../core/types/card";
import type { AmountExpr, Duration, Effect, StatModifier, TargetFilter, TargetSelector } from "../core/types/effect";
import type { ClassFrame, HeroDefinition, RaceFrame, RaceId, Stats } from "../core/types/hero";
import { CLASS_KEYWORD_LABEL, KEYWORD_LABEL } from "../core/types/keyword";
import { composeHeroStats } from "../core/stats/compose";

export type { CardType, Rarity };

export interface CardPoolGroup {
  id: string;
  label: string;
  kind: "generic" | "neutral" | "race" | "enemyInternal";
  cards: IndexedCard[];
  total: number;
}

export interface IndexedCard {
  card: Card;
  poolId: string;
  poolLabel: string;
  poolKind: CardPoolGroup["kind"];
  typeLabel: string;
  rarityLabel: string;
  effectSummary: string[];
  searchableText: string;
}

export interface ImplementedRuleSection {
  id: "turn" | "combat" | "resources" | "corruption" | "ai" | "victory";
  title: string;
  items: string[];
}

export interface HeroIndexEntry {
  hero: HeroDefinition;
  race: RaceFrame;
  classFrame: ClassFrame;
  stats: Stats;
}

export interface GameIndexData {
  cards: IndexedCard[];
  playableCards: IndexedCard[];
  enemyInternalCards: IndexedCard[];
  cardGroups: CardPoolGroup[];
  heroes: HeroIndexEntry[];
  races: RaceFrame[];
  classes: ClassFrame[];
  keywords: Array<{ id: string; label: string }>;
  classKeywords: Array<{ id: string; label: string }>;
  ruleSections: ImplementedRuleSection[];
  stats: {
    totalCards: number;
    playableCards: number;
    enemyInternalCards: number;
    byType: Record<CardType, number>;
    byRarity: Record<Rarity, number>;
    byCost: Record<number, number>;
  };
}

export const CARD_TYPE_LABEL: Record<CardType, string> = {
  troop: "兵力",
  action: "行動",
  spell: "法術",
  equipment: "裝備",
  field: "場地",
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "普通",
  uncommon: "非凡",
  rare: "稀有",
  legendary: "傳說",
};

const EMPTY_TYPE_COUNTS: Record<CardType, number> = {
  troop: 0,
  action: 0,
  spell: 0,
  equipment: 0,
  field: 0,
};

const EMPTY_RARITY_COUNTS: Record<Rarity, number> = {
  common: 0,
  uncommon: 0,
  rare: 0,
  legendary: 0,
};

export function buildGameIndexData(): GameIndexData {
  const groupSpecs = [
    { id: "generic", label: "通用卡", kind: "generic" as const, cards: GENERIC_CARDS },
    { id: "neutral", label: "中立傳說", kind: "neutral" as const, cards: NEUTRAL_CARDS },
    ...Object.entries(RACE_CARDS).map(([raceId, cards]) => ({
      id: `race:${raceId}`,
      label: `${RACES[raceId as RaceId]?.name ?? raceId}種族卡`,
      kind: "race" as const,
      cards,
    })),
    { id: "enemy:internal", label: "敵方/內部召喚卡", kind: "enemyInternal" as const, cards: ENEMY_INTERNAL_CARDS },
  ];

  const cardGroups: CardPoolGroup[] = groupSpecs.map((group) => {
    const cards = group.cards.map((card) => indexCard(card, group.id, group.label, group.kind));
    return { id: group.id, label: group.label, kind: group.kind, cards, total: cards.length };
  });

  const cards = cardGroups.flatMap((group) => group.cards);
  const enemyInternalCards = cardGroups.find((group) => group.kind === "enemyInternal")?.cards ?? [];
  const playableCards = cards.filter((entry) => entry.poolKind !== "enemyInternal");

  return {
    cards,
    playableCards,
    enemyInternalCards,
    cardGroups,
    heroes: HERO_LIST.map((hero) => {
      const race = RACES[hero.raceId];
      const classFrame = CLASSES[hero.classId];
      return { hero, race, classFrame, stats: composeHeroStats(hero, race, classFrame) };
    }),
    races: Object.values(RACES),
    classes: Object.values(CLASSES),
    keywords: Object.entries(KEYWORD_LABEL).map(([id, label]) => ({ id, label })),
    classKeywords: Object.entries(CLASS_KEYWORD_LABEL).map(([id, label]) => ({ id, label })),
    ruleSections: IMPLEMENTED_RULE_SECTIONS,
    stats: {
      totalCards: cards.length,
      playableCards: ALL_CARDS.length,
      enemyInternalCards: ENEMY_INTERNAL_CARDS.length,
      byType: countByType(cards.map((entry) => entry.card)),
      byRarity: countByRarity(cards.map((entry) => entry.card)),
      byCost: countByCost(cards.map((entry) => entry.card)),
    },
  };
}

function indexCard(card: Card, poolId: string, poolLabel: string, poolKind: CardPoolGroup["kind"]): IndexedCard {
  const effectSummary = describeCardEffects(card);
  const typeLabel = CARD_TYPE_LABEL[card.type];
  const rarityLabel = RARITY_LABEL[card.rarity];
  const searchableText = [
    card.id,
    card.name,
    typeLabel,
    rarityLabel,
    poolLabel,
    card.flavor ?? "",
    effectSummary.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return { card, poolId, poolLabel, poolKind, typeLabel, rarityLabel, effectSummary, searchableText };
}

function countByType(cards: readonly Card[]): Record<CardType, number> {
  const counts = { ...EMPTY_TYPE_COUNTS };
  for (const card of cards) counts[card.type]++;
  return counts;
}

function countByRarity(cards: readonly Card[]): Record<Rarity, number> {
  const counts = { ...EMPTY_RARITY_COUNTS };
  for (const card of cards) counts[card.rarity]++;
  return counts;
}

function countByCost(cards: readonly Card[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const card of cards) counts[card.cost] = (counts[card.cost] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => Number(a) - Number(b))) as Record<number, number>;
}

export function describeCardEffects(card: Card): string[] {
  const lines: string[] = [];

  if (card.type === "troop") {
    lines.push(`體質 ${card.hp}/${card.atk}/${card.def}`);
    if (card.keywords.length > 0) lines.push(`關鍵字：${card.keywords.map((keyword) => KEYWORD_LABEL[keyword]).join("、")}`);
    appendEffects(lines, "入場", card.onPlay);
    appendEffects(lines, "謝幕", card.onDestroy);
    appendEffects(lines, "回合結束", card.onTurnEnd);
    appendEffects(lines, "被動", card.passive);
  }

  if (card.type === "action") {
    appendEffects(lines, "效果", card.effects);
    appendEffects(lines, "後續", card.postEffects);
  }

  if (card.type === "spell" || card.type === "field") {
    appendEffects(lines, "效果", card.effects);
  }

  if (card.type === "equipment") {
    lines.push(`槽位：${equipmentSlotLabel(card.slot)}`);
    const modifiers = describeModifiers(card.modifiers);
    if (modifiers) lines.push(`修正：${modifiers}`);
    appendEffects(lines, "入場", card.onPlay);
    appendEffects(lines, "被動", card.passive);
  }

  if (card.flavor) lines.push(card.flavor);
  return lines.length > 0 ? lines : ["無額外效果"];
}

function appendEffects(lines: string[], label: string, effects: readonly Effect[] | undefined): void {
  if (!effects || effects.length === 0) return;
  lines.push(`${label}：${effects.map(describeEffect).join("；")}`);
}

export function describeEffect(effect: Effect): string {
  switch (effect.kind) {
    case "damage":
      return `${describeTarget(effect.target)} ${describeAmount(effect.amount)}傷害${flagText([
        effect.ignoreDef ? "無視 DEF" : "",
        effect.ignoreGuard ? "無視守護" : "",
        effect.lifesteal ? `汲取 ${effect.lifesteal}` : "",
      ])}`;
    case "heal":
      return `${describeTarget(effect.target)} 恢復 ${describeAmount(effect.amount)}`;
    case "draw":
      return `抽 ${effect.count} 張`;
    case "discard":
      return `棄 ${effect.count} 張`;
    case "summon":
      return `召喚 ${effect.cardId} ×${effect.count} 到${sideLabel(effect.side)}`;
    case "gauge":
      return `${sideLabel(effect.side)}量表 ${signed(effect.delta)}`;
    case "morale":
      return `鬥志 ${signed(effect.delta)}`;
    case "mana":
      return `${effect.temporary ? "臨時" : ""}魔力 ${signed(effect.delta)}`;
    case "armor":
      return `${effect.target ? `${describeTarget(effect.target)} ` : ""}護甲 +${effect.amount}`;
    case "buff":
      return `${describeTarget(effect.target)} ${describeModifiers(effect.mod)}（${describeDuration(effect.duration)}）`;
    case "addKeyword":
      return `${describeTarget(effect.target)}獲得${KEYWORD_LABEL[effect.keyword]}（${describeDuration(effect.duration)}）`;
    case "freeze":
      return `${describeTarget(effect.target)}凍結 ${effect.turns} 回合`;
    case "stability":
      return `穩定度 ${signed(effect.delta)}`;
    case "search":
      return `搜尋${effect.predicate.type ? CARD_TYPE_LABEL[effect.predicate.type as CardType] ?? effect.predicate.type : "卡牌"}${effect.toHand ? "加入手牌" : ""}${effect.costMod ? `，費用 ${signed(effect.costMod)}` : ""}`;
    case "destroyField":
      return "摧毀場地";
    case "scripted":
      return `腳本效果：${effect.tag}${effect.payload ? ` ${JSON.stringify(effect.payload)}` : ""}`;
    default:
      return `效果：${(effect as { kind: string }).kind}`;
  }
}

function describeAmount(amount: AmountExpr): string {
  switch (amount.kind) {
    case "const":
      return `${amount.value}`;
    case "atk":
      return formatFormula("ATK", amount.mult, amount.bonus);
    case "spellsCastThisGame":
      return `本場法術數×${amount.mult}`;
    case "spellsCastThisTurn":
      return `本回合法術數×${amount.mult}`;
    case "alliesOnBoard":
      return formatFormula("我方場上兵力數", amount.mult, amount.bonus);
    case "rage":
      return formatFormula("血怒", amount.mult, amount.bonus);
    case "command":
      return formatFormula("CMD", amount.mult, amount.bonus);
  }
}

function formatFormula(base: string, mult = 1, bonus = 0): string {
  const pieces = [mult === 1 ? base : `${base}×${mult}`];
  if (bonus !== 0) pieces.push(signed(bonus));
  return pieces.join("");
}

function describeTarget(target: TargetSelector): string {
  switch (target.kind) {
    case "self":
      return "自身";
    case "playerHero":
      return "玩家英雄";
    case "enemyHero":
      return "敵方英雄";
    case "single":
      return `單體${describeFilter(target.filter)}`;
    case "all":
      return `全體${describeFilter(target.filter)}`;
    case "random":
      return `隨機 ${target.count} 個${describeFilter(target.filter)}`;
  }
}

function describeFilter(filter: TargetFilter): string {
  const parts: string[] = [];
  if (filter.side) parts.push(sideLabel(filter.side));
  if (filter.entity && filter.entity !== "any") parts.push(entityLabel(filter.entity));
  if (filter.keyword) parts.push(KEYWORD_LABEL[filter.keyword]);
  if (filter.minHpPct !== undefined) parts.push(`HP≥${filter.minHpPct}%`);
  if (filter.maxHpPct !== undefined) parts.push(`HP≤${filter.maxHpPct}%`);
  return parts.length > 0 ? `（${parts.join("、")}）` : "";
}

function describeDuration(duration: Duration): string {
  switch (duration.kind) {
    case "permanent":
      return "永久";
    case "thisTurn":
      return "本回合";
    case "turns":
      return `${duration.count} 回合`;
  }
}

function describeModifiers(mod: StatModifier): string {
  const parts = [
    statPart("HP", mod.hp),
    statPart("ATK", mod.atk),
    statPart("DEF", mod.def),
    statPart("CMD", mod.cmd),
  ].filter(Boolean);
  return parts.join("、");
}

function statPart(label: string, value: number | undefined): string {
  return value === undefined || value === 0 ? "" : `${label} ${signed(value)}`;
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function flagText(flags: string[]): string {
  const active = flags.filter(Boolean);
  return active.length > 0 ? `（${active.join("、")}）` : "";
}

function sideLabel(side: TargetFilter["side"]): string {
  switch (side) {
    case "player":
      return "玩家";
    case "enemy":
      return "敵方";
    case "self":
      return "我方";
    case "all":
      return "雙方";
    default:
      return "";
  }
}

function entityLabel(entity: NonNullable<TargetFilter["entity"]>): string {
  switch (entity) {
    case "hero":
      return "英雄";
    case "troop":
      return "兵力";
    case "any":
      return "任意";
  }
}

function equipmentSlotLabel(slot: EquipmentCard["slot"]): string {
  switch (slot) {
    case "weapon":
      return "武器";
    case "armor":
      return "防具";
    case "trinket":
      return "飾品";
  }
}

export function cardStatsLine(card: Card): string {
  if (card.type !== "troop") return "";
  const troop = card as TroopCard;
  return `HP ${troop.hp} / ATK ${troop.atk} / DEF ${troop.def}`;
}

const IMPLEMENTED_RULE_SECTIONS: ImplementedRuleSection[] = [
  {
    id: "turn",
    title: "回合流程",
    items: [
      "玩家固定先攻；每次輪到一方時進入 start → main，結束後切換到另一方。",
      "回合開始抽 1 張，手牌上限由抽牌邏輯處理；魔力上限依回合提升並回滿。",
      "主要階段已實裝部署兵力、施放法術、使用行動卡、裝備、放置場地、兵力攻擊、英雄技能與終極技。",
    ],
  },
  {
    id: "combat",
    title: "攻擊與關鍵字",
    items: [
      "兵力攻擊採兵力優先：敵方有存活兵力時不能直接攻擊英雄，攻城可繞過。",
      "英雄行動卡與技能採守護優先：敵方有守護兵力時必須先指定守護，ignoreGuard 可繞過。",
      "暈眩、突進、疾走、威壓、凍結、必殺、穿透都已在攻擊合法性或傷害結算中實作。",
    ],
  },
  {
    id: "resources",
    title: "資源系統",
    items: [
      "魔力水晶每回合依回合數刷新；一般上限 10，精靈框架上限 13。",
      "鬥志用於主動技能與終極技；行動命中、擊殺敵兵與我方兵力死亡等規則由核心結算累積。",
      "種族量表由英雄個體定義觸發條件，已支援部署、存活、施法、裝備、受傷、回合開始等來源。",
    ],
  },
  {
    id: "corruption",
    title: "腐化與穩定度",
    items: [
      "穩定度介於 0 到 100；跌破 75/50/25/0 會進入對應腐化階段。",
      "75 階段會移除雙方 1 個兵力欄；50 階段記錄敵方額外部署提示；25 階段治療減半；0 直接敗北。",
      "腐植巢穴兵力被摧毀時會讓穩定度 -2。",
    ],
  },
  {
    id: "ai",
    title: "AI 與巢穴戰",
    items: [
      "目前敵方為腐植巢穴，HP 80 / DEF 0，不使用英雄技能或終極技。",
      "AI 回合會依巢穴邏輯部署腐植兵力並推進回合，確保玩家可連續進行多回合戰鬥。",
      "敵方內部卡池包含腐植芽、腐植觸手、腐植膿瘤與召喚用標記兵力。",
    ],
  },
  {
    id: "victory",
    title: "勝負條件",
    items: [
      "敵方英雄或巢穴 HP 歸零時玩家勝利。",
      "玩家英雄 HP 歸零時玩家失敗。",
      "次元壁穩定度歸零時玩家失敗。",
    ],
  },
];
