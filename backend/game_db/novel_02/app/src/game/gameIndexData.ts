import { ALL_CARDS, DEMON_CARDS, ENEMY_INTERNAL_CARDS, GENERIC_CARDS, NEUTRAL_CARDS, RACE_CARDS } from "../data/cards";
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
  id: "turn" | "combat" | "resources" | "corruption" | "ai" | "victory" | "bosses" | "lairs" | "tower";
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
    appendEffects(lines, "入場", card.onPlay, card);
    appendEffects(lines, "謝幕", card.onDestroy, card);
    appendEffects(lines, "回合結束", card.onTurnEnd, card);
    appendEffects(lines, "被動", card.passive, card);
  }

  if (card.type === "action") {
    appendEffects(lines, "效果", card.effects, card);
    appendEffects(lines, "後續", card.postEffects, card);
  }

  if (card.type === "spell" || card.type === "field") {
    appendEffects(lines, "效果", card.effects, card);
  }

  if (card.type === "equipment") {
    lines.push(`槽位：${equipmentSlotLabel(card.slot)}`);
    const modifiers = describeModifiers(card.modifiers);
    if (modifiers) lines.push(`修正：${modifiers}`);
    appendEffects(lines, "入場", card.onPlay, card);
    appendEffects(lines, "被動", card.passive, card);
  }

  if (card.flavor) lines.push(card.flavor);
  return lines.length > 0 ? lines : ["無額外效果"];
}

function appendEffects(lines: string[], label: string, effects: readonly Effect[] | undefined, card: Card): void {
  if (!effects || effects.length === 0) return;
  lines.push(`${label}：${effects.map((effect) => describeEffect(effect, card)).join("；")}`);
}

export function describeEffect(effect: Effect, card?: Card): string {
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
      return `召喚 ${cardDisplayName(effect.cardId)} ×${effect.count} 到${sideLabel(effect.side)}`;
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
      return describeScriptedEffect(effect.tag, effect.payload, card);
    default:
      return `效果：${(effect as { kind: string }).kind}`;
  }
}

type ScriptedEffectFormatter = string | ((payload: unknown, card?: Card) => string);

const SCRIPTED_EFFECT_TEXT: Record<string, ScriptedEffectFormatter> = {
  HEAL_ADJACENT: (payload) => `恢復相鄰兵力 ${payloadNumber(payload, "amount", 3)} HP`,
  FIRST_ATTACK_DOUBLE: "入場後首次攻擊傷害 ×2",
  GIVE_ANOTHER_RUSH: "使另一個己方兵力獲得突進",
  ABSORB_HALF_HERO_ACTION_DAMAGE: "英雄受到行動卡傷害時，此兵力代替承受一半",
  MORALE_IF_KILLED: (payload) => `若本次傷害擊殺目標，鬥志 +${payloadNumber(payload, "amount", 20)}`,
  SELF_DAMAGE_FIXED: (payload) => `英雄受到 ${payloadNumber(payload, "amount", 10)} 點不可減免自傷`,
  DISABLE_ACTION_THIS_TURN: "本回合無法再使用行動卡",
  STARFALL_BLADE: "對敵方英雄造成 ATK×2+20 傷害，無視 DEF 與守護；穩定度 ≤50 時額外 +15",
  EXTRA_ACTIONS: (payload) => `本回合可額外使用 ${payloadNumber(payload, "count", 2)} 張行動卡`,
  OATH_CHOICE: "三選一：全面恢復（英雄 +30 HP，全兵力 +10 HP）/ 全面強化（全兵力 +5 ATK，持續 3 回合）/ 全面淨化（移除所有負面狀態，免疫 1 回合）",

  LUCKY_DRAW_CHANCE: (payload) => `每回合抽牌時 ${payloadNumber(payload, "pct", 30)}% 機率額外抽 1 張`,
  MANA_ON_KILL: "英雄擊殺兵力時，本回合魔力 +1",
  DEF_THRESHOLD_IMMUNE: "小於英雄 DEF 的傷害完全免疫",
  MORALE_ON_DEPLOY: (payload) => `部署兵力時鬥志 +${payloadNumber(payload, "amount", 5)}`,
  HERO_LIFESTEAL: (payload) => `英雄攻擊造成傷害時，恢復傷害量 ${payloadNumber(payload, "pct", 20)}% 的 HP`,
  DRAGONSCALE: "免疫燃燒與冰凍；每回合恢復 3 HP",

  FIELD_MANA_NODE: "場地：每回合雙方額外獲得 1 魔力；法術效果 +10%",
  FIELD_BURN: (_payload, card) =>
    card?.id === "F_BURN_INFERNO"
      ? "場地：每回合結束時，雙方兵力受到 2 傷害"
      : "場地：每回合所有兵力受到 3 傷害；治療效果 -50%",
  FIELD_RESURRECT: "場地：兵力被摧毀時，30% 機率以 30% HP 原地復活",
  FIELD_STORM: "場地：每回合開始時，隨機 1 個敵方兵力受到 6 傷害；所有兵力不可被治癒",
  FIELD_DIMENSIONAL_RIFT: "場地：穩定度每回合 -5；所有法術與行動卡傷害 +50%",
  FIELD_BURN_APPLY: "戰鬥開始時設置獄火場地",

  UNTARGETABLE_BY_SPELL: "無法被法術選為目標",
  DESTROY_HIGHEST_ATK_BOTH: "雙方各摧毀 ATK 最高的 1 個兵力",
  ENEMY_DRAW: (payload) => `敵方抽 ${payloadNumber(payload, "count", 1)} 張牌`,
  GRANT_IGNORE_GUARD_THIS_TURN: "本回合英雄攻擊與技能無視守護",
  MOON_RELIC: "每回合開始時，種族量表 +10；致命傷時可消耗 50 量表以 1 HP 存活（每場限 1 次）",
  DIMENSION_SHARD: "穩定度 +25，抽 1 張；若穩定度已滿，改為對敵方全體造成 15 傷害",
  DOOMSDAY_START: (payload) =>
    `設置末日倒數 ${payloadNumber(payload, "turns", 3)} 回合；結束時對敵方全體造成 ${payloadNumber(payload, "damage", 50)} 傷害`,

  ATK_PER_ALLY: "場上每有 1 個其他己方兵力，此兵力 ATK +1",
  LEGION_RALLY: "所有己方兵力 +3 ATK / +3 DEF 持續 2 回合；場上兵力 ≥4 時效果翻倍",
  DRAW_TROOPS: (payload) => `從牌庫抽 ${payloadNumber(payload, "count", 3)} 張兵力牌`,
  DEPLOY_DISCOUNT_THIS_TURN: (payload) => `本回合兵力部署費用 -${payloadNumber(payload, "amount", 2)}`,
  OATH_BLADE: "每次英雄行動卡攻擊後，隨機 1 個己方兵力永久 +2 ATK；場上兵力 ≥3 時行動卡傷害 +10",

  MOONLIGHT_ARROW: "造成 8 傷害；共鳴 ≥2 時改為 12",
  ATK_PER_SPELL_CAST: "己方每施放 1 張法術，此兵力永久 +1 ATK",
  DOUBLE_NEXT_SPELL: "本回合下一張法術效果翻倍",
  FIELD_ELVEN_WARD: "場地：所有法術效果 +25%；兵力部署費用 +1",
  HP_PER_SPELL_CAST: "己方每施放 1 張法術，此兵力 +3 HP",
  RESONANCE_NO_RESET: "本回合共鳴不會重置，累積至下回合",
  AENO_FORBIDDEN: "造成 50 魔法傷害；共鳴 ≥4 時改為對敵方全體造成 80 傷害",

  RAPID_FORGE: "將 1 張手牌轉化為隨機裝備卡",
  ALLOY_RECYCLE: "拆除 1 件裝備或 1 個器具，獲得其費用 ×2 的魔力",
  HERO_DEF_PLUS_2_WHILE_ALIVE: "存活期間英雄 DEF +2",
  AUTO_TURRET_FIRE: "回合結束時，自動攻擊 ATK 最高的敵方兵力",
  IMMUNE_SPELL_DAMAGE: "免疫法術傷害",
  MINEVEIN_BLAST: "造成（已裝備裝備數 + 場上器具數）×8 傷害",
  DWARF_ALE: "恢復英雄 12 HP；裝備 ≥2 件時額外 +8",
  ANCESTRAL_BLUEPRINT: "永久：所有裝備與器具費用 -1（最低 1）",
  DAMAGE_ENEMY_HERO_FIXED: (payload) => `對敵方英雄造成 ${payloadNumber(payload, "amount", 10)} 固定傷害`,
  CLAN_WARHAMMER: "裝備 3 件時額外 +10 固定傷害；場上每有 1 個器具，英雄 ATK +2",

  Y_FOXFIRE: "人形：造成 15 魔法傷害；妖形：造成 10 傷害並灼傷 2 回合",
  Y_SERPENT_GUARD: "人形：此兵力受到的法術傷害減半；妖形：此兵力 ATK +4",
  Y_ESSENCE_CORE: "靈蘊上限 +50；切換形態時恢復英雄 5 HP",
  Y_FORM_TOGGLE: "立即切換人形 / 妖形",
  Y_DAMAGE_REDUCE_THIS_TURN: (payload) => `英雄本回合受到的傷害 -${payloadNumber(payload, "pct", 50)}%`,
  Y_HUNDRED_GHOSTS: "人形：召喚 2 個幻影；妖形：召喚 1 個妖獸",
  Y_ILLUSION_MAZE: "人形：敵方所有兵力 ATK -4 持續 2 回合；妖形：控制敵方 1 個兵力 2 回合",
  Y_NINETAILS_KEYWORDS: "人形：此兵力獲得威壓；妖形：此兵力獲得疾走與汲取",
  Y_PRIMORDIAL_BLOOD: "進入始祖妖形 2 回合；己方所有兵力 +3 ATK / +3 DEF",

  B_BLOOD_RITE: "對 1 個己方兵力血祭：HP 減半、ATK 翻倍 2 回合；額外 ATK +3，血怒 +1",
  B_SAVAGEFANG_BLOODRITE_X3: "被血祭時 ATK ×3（取代 ATK ×2）",
  B_THORNS_TO_KILLER: (payload) => `對擊殺者造成 ${payloadNumber(payload, "amount", 5)} 傷害`,
  B_PACK_TACTICS_MARK: "本回合英雄攻擊命中時血怒 +1",
  B_BRUTE_CHARGE: "英雄造成 ATK 傷害，無視護甲與守護；血怒 ≥5 時額外 +10",
  B_BATTLE_SCAR_MEDAL: "英雄每跨過 10% HP 門檻時，永久 +1 ATK",
  B_PRIMAL_HOWL: "所有己方兵力進入血祭狀態：HP 減半，ATK 翻倍 2 回合；血怒 +3",
  B_PRIMORDIAL_BEAST_SOUL: "血怒立即疊至 10；3 回合內不因治療降低；己方兵力血祭但不損 HP",

  G_ECHO_RESONANCE: "移除 2 層透支；若沒有透支，改為恢復英雄 10 HP",
  G_FOLLOWER_PROXY: "英雄受傷時，此兵力代替承受 5 傷害",
  G_DIVINE_BARRIER: (payload) => `${payloadNumber(payload, "turns", 2)} 回合內英雄受到的傷害 -${payloadNumber(payload, "pct", 30)}%`,
  G_TRANSCEND: "消耗英雄 10% 當前 HP",
  G_OVERDRAFT_ADD: (payload) => `透支 +${payloadNumber(payload, "amount", 1)}`,
  G_DIVINE_HIDE: "本回合英雄受到的下 1 次傷害完全無效",
  G_DIVINE_WORD_COLLAPSE: "消耗 40 神力殘響；對敵方全體造成 25 固定傷害；己方兵力受 10 傷害；透支 +3",
  G_OVERDRAFT_REMOVE: (payload) => `移除 ${payloadNumber(payload, "amount", 1)} 層透支`,
  G_GENESIS_FRAGMENT: "消耗所有神力殘響（至少 50）；對敵方英雄造成消耗量 ×1.5 傷害，清除透支並摧毀己方兵力",

  DM_FLAME_IMMUNE: "免疫燃燒與火焰場地傷害",
  DM_FREEZE_RANDOM_ENEMY: (payload) => `入場時隨機凍結 1 個敵方兵力 ${payloadNumber(payload, "turns", 2)} 回合`,
  DM_CORRUPTION_SPREAD: "腐化蔓延：削弱敵方陣線並推進黑暗蝕",
  DM_ENERGY_CORE_PASSIVE: "英雄造成傷害時黑暗蝕 +5",
  DM_RIFT_FIELD: "場地：每回合穩定度 -3，黑暗蝕 +5",
  DM_SCORCHED_FIELD: "場地：每回合灼燒敵方兵力，並降低敵方治療效果",
  DM_CURSE_GENERAL_AURA: "光環：敵方兵力 ATK / DEF 下降",
  DM_DARK_DESCENT: "召喚黑暗軍勢並大幅推進黑暗蝕",
  DM_DOOM_GIANT_SPELL_IMMUNE: "免疫法術傷害",

  ELDER_TOUCH: "攻擊命中時穩定度 -1",
  FEY_FORM_SWITCH: "切換人形 / 妖形",
  FEY_ANCESTOR_FORM: (payload) => `同享人形與妖形加成 ${payloadNumber(payload, "turns", 3)} 回合`,
  TOTAL_MOBILIZATION: "立即部署手牌中所有兵力；本回合己方兵力依場上數量獲得 ATK 加成",
  PRIMAL_AWAKENING: "對敵方英雄造成（ATK + 血怒×5）×2 傷害；血怒歸零，英雄 HP +30%",
  PRECISION_SUPPORT_GUIDANCE: "敵方所有兵力 DEF 歸零，失去守護與正向增益；抽 2 張牌",
};

function describeScriptedEffect(tag: string, payload: unknown, card?: Card): string {
  const formatter = SCRIPTED_EFFECT_TEXT[tag];
  if (typeof formatter === "function") return formatter(payload, card);
  if (formatter) return formatter;
  return "特殊效果待補文字";
}

function payloadNumber(payload: unknown, key: string, fallback: number): number {
  if (!payload || typeof payload !== "object") return fallback;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "number" ? value : fallback;
}

let cardNameIndex: Map<string, string> | undefined;

function cardDisplayName(cardId: string): string {
  cardNameIndex ??= new Map(
    [...ALL_CARDS, ...ENEMY_INTERNAL_CARDS, ...DEMON_CARDS].map((card) => [card.id, card.name]),
  );
  return cardNameIndex.get(cardId) ?? cardId;
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
    title: "AI 與敵人系統",
    items: [
      "Utility AI 引擎統一 6 種考量（damageDealt / lethal / boardControl / heroPressure / selfSurvival / resourceEfficiency / gaugeBuildup / stabilityPressure）。",
      "巢穴 AI 使用召喚池 + 召喚節奏（summonCadenceTurns）；Boss AI 啟用手牌 + 召喚池雙軌部署。",
      "難度旋鈕 DIFFICULTY_PRESETS 提供 easy / normal / hard，影響 noise / temperature / 考量丟棄率。",
    ],
  },
  {
    id: "lairs",
    title: "§E.2 巢穴戰",
    items: [
      "腐植巢穴：HP 80 / DEF 0；每回合 1 召喚；兵力被摧毀穩定度 -2。",
      "蟲族窩巢：HP 100 / DEF 2；每回合 2 召喚；5 蟲母幼體合併為蟲后。",
      "魔獸洞穴：HP 120 / DEF 3；每 2 回合 1 召喚；半血爆發兵力 ATK ×2。",
      "暗影門戶：HP 150 / DEF 5；每 2 回合 1–2 召喚；穩定度 -3/回合 + 兵力守護。",
      "晶體礦脈：HP 100 / DEF 8；每 3 回合 1 召喚；3 晶體碎片合併為魔像。",
      "腐化神殿：HP 200 / DEF 3；每 2 回合 1 召喚；祭司存活時巢穴 +5 HP/回合。",
    ],
  },
  {
    id: "bosses",
    title: "§E.1 Boss 戰",
    items: [
      "惡魔將領（demon·commander）HP 130 / ATK 14 / DEF 7 / CMD 5：借用軍團統帥技能組。",
      "夢魔宗主（demon·illusionist）HP 90 / ATK 10 / DEF 4 / CMD 4：召喚威壓夢幻體。",
      "古魔（demon·mage）HP 180 / ATK 16 / DEF 5 / CMD 6：借用大賢者技能；兵力觸碰穩定度 -1。",
      "炎魔（demon·berserker）HP 160 / ATK 18 / DEF 6 / CMD 3：開局自動掛獄火場地。",
      "妖族叛王（fey·illusionist）HP 100 / ATK 13 / DEF 6 / CMD 5：完整妖族雙形態切換。",
      "獸王（beast·berserker）HP 140 / ATK 20 / DEF 4 / CMD 4：完整血怒體系。",
      "v1 不啟用多階段；HP 跨 1/3 / 2/3 門檻不切換能力。",
    ],
  },
  {
    id: "tower",
    title: "§F.1 試煉塔",
    items: [
      "30 層 Roguelike：5 / 10 / 15 / 20 / 25 / 30 為 Boss，其餘 24 層為巢穴循環。",
      "勝利後三選一獎勵：保底治療 + 加卡 + 強化體質/攻擊。",
      "難度遞增：HP × (1 + 0.04·(層數-1))、ATK × (1 + 0.025·(層數-1))；Boss 層 HP 額外 ×1.1。",
      "天象事件：Boss 層 100% 觸發，其他層 50%；雙月同圓 / 副月凌主月 / 碎片雨 / 日蝕 / 流星墜 / 靈潮湧動。",
      "HP / 裝備 / 牌組變動跨層保留；鬥志、量表、buff 每場重置。試煉塔狀態為純記憶體（重新整理會重置）。",
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
