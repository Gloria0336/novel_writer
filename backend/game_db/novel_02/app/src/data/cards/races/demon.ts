import type { Card, TroopCard } from "../../../core/types/card";

/**
 * 魔族種族卡 DM01-DM20
 * 設計主軸：次元侵蝕、砲灰召喚、精英壓制。與黑暗蝕量表互動。
 *
 * 黑暗蝕（Dark Erosion）量表規則：
 *   - 每次對玩家英雄造成傷害 +1（由引擎結算）
 *   - 任一兵力被摧毀 +5（由引擎結算）
 *   - 每回合自動 +3（由引擎結算）
 *   - 滿 100：次元壁穩定度 -10，並對玩家方隨機造成 3 次 ATK×30% 傷害（可打英雄或兵力），量表歸零
 */

// ── 內部召喚 Token（不入牌組）──────────────────────────────────────────────
export const DEMON_TOKENS: TroopCard[] = [
  {
    id: "DM_TOKEN_WORM",
    type: "troop",
    name: "腐蟲",
    cost: 0,
    rarity: "common",
    hp: 2,
    atk: 2,
    def: 0,
    keywords: [],
    onDestroy: [{ kind: "gauge", delta: 5, side: "self" }],
  },
];

// ── 魔族種族卡 ─────────────────────────────────────────────────────────────
export const DEMON_CARDS: Card[] = [

  // ── 魔化類：砲灰基層（共通）─────────────────────────────────────────────

  {
    id: "DM01",
    type: "troop",
    name: "腐爛步兵",
    cost: 1,
    rarity: "common",
    hp: 5,
    atk: 3,
    def: 0,
    keywords: [],
    onPlay: [{ kind: "gauge", delta: 5, side: "self" }],
    onDestroy: [
      { kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "const", value: 2 } },
    ],
    flavor: "腐化的殘軀，即使倒下也將黑暗帶入敵陣。",
  },

  {
    id: "DM02",
    type: "troop",
    name: "腐獸衝鋒",
    cost: 2,
    rarity: "common",
    hp: 14,
    atk: 7,
    def: 0,
    keywords: ["rush"],
    onDestroy: [{ kind: "gauge", delta: 10, side: "self" }],
    flavor: "獸性被黑暗能量無限放大，死亡前仍嘶吼著撲向前方。",
  },

  {
    id: "DM09",
    type: "spell",
    name: "蟲群滲透",
    cost: 2,
    rarity: "common",
    effects: [
      { kind: "summon", cardId: "DM_TOKEN_WORM", count: 3, side: "self" },
      { kind: "gauge", delta: 5, side: "self" },
    ],
    flavor: "裂縫一旦打開，無數腐蟲從黑暗的縫隙中傾瀉而出。",
  },

  {
    id: "DM10",
    type: "spell",
    name: "黑暗詛咒",
    cost: 2,
    rarity: "common",
    effects: [
      {
        kind: "buff",
        target: { kind: "single", filter: { side: "enemy", entity: "troop" } },
        mod: { atk: -4, def: -4 },
        duration: { kind: "permanent" },
      },
    ],
    flavor: "咒魔輕語，黑暗能量如毒液般腐化目標的意志與血肉。",
  },

  {
    id: "DM14",
    type: "action",
    name: "黑暗重擊",
    cost: 2,
    rarity: "common",
    effects: [
      { kind: "damage", target: { kind: "single", filter: { side: "enemy", entity: "any" } }, amount: { kind: "atk", bonus: 3 } },
      { kind: "gauge", delta: 8, side: "self" },
    ],
    flavor: "每一擊都將黑暗能量灌入傷口，讓傷者感受次元侵蝕的痛苦。",
  },

  // ── 惡魔類：菁英分支（少而精）──────────────────────────────────────────

  {
    id: "DM03",
    type: "troop",
    name: "夢魔刺客",
    cost: 3,
    rarity: "uncommon",
    hp: 10,
    atk: 9,
    def: 0,
    keywords: ["rush", "lethal"],
    onPlay: [{ kind: "gauge", delta: 10, side: "self" }],
    flavor: "幽影穿梭於現實與夢境之間，觸手一纏便是永眠。",
  },

  {
    id: "DM04",
    type: "troop",
    name: "天魔突擊兵",
    cost: 3,
    rarity: "uncommon",
    hp: 12,
    atk: 8,
    def: 1,
    keywords: ["haste"],
    onPlay: [{ kind: "gauge", delta: 8, side: "self" }],
    flavor: "翅膀展開的瞬間，天空本身都成了武器。",
  },

  {
    id: "DM13",
    type: "spell",
    name: "黑暗祭祀",
    cost: 3,
    rarity: "uncommon",
    effects: [
      {
        kind: "damage",
        target: { kind: "all", filter: { entity: "troop" } },
        amount: { kind: "const", value: 5 },
      },
      { kind: "gauge", delta: 30, side: "self" },
    ],
    flavor: "以犧牲換取黑暗的饋贈——血祭不分敵我，只有侵蝕。",
  },

  {
    id: "DM11",
    type: "spell",
    name: "次元侵蝕",
    cost: 3,
    rarity: "uncommon",
    effects: [
      { kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "const", value: 10 } },
      { kind: "stability", delta: -8 },
      { kind: "gauge", delta: 15, side: "self" },
    ],
    flavor: "黑暗次元的壓力從四面八方擠壓現界，英雄感到空間本身在撕裂。",
  },

  {
    id: "DM05",
    type: "troop",
    name: "炎魔守衛",
    cost: 4,
    rarity: "uncommon",
    hp: 22,
    atk: 7,
    def: 3,
    keywords: [],
    passive: [{ kind: "scripted", tag: "DM_FLAME_IMMUNE" }],
    onTurnEnd: [
      { kind: "damage", target: { kind: "enemyHero" }, amount: { kind: "const", value: 3 } },
    ],
    flavor: "岩漿是牠的搖籃，火焰是牠的呼吸——燃燒對炎魔而言不過是撫觸。",
  },

  {
    id: "DM06",
    type: "troop",
    name: "冰魔法師",
    cost: 4,
    rarity: "uncommon",
    hp: 14,
    atk: 5,
    def: 3,
    keywords: [],
    onPlay: [{ kind: "scripted", tag: "DM_FREEZE_RANDOM_ENEMY", payload: { turns: 2 } }],
    onTurnEnd: [
      {
        kind: "damage",
        target: { kind: "all", filter: { side: "enemy", entity: "troop" } },
        amount: { kind: "const", value: 5 },
      },
    ],
    flavor: "冰晶在指尖凝結成鐐銬，每一個回合戰場都離凍土更近一步。",
  },

  {
    id: "DM12",
    type: "spell",
    name: "腐化蔓延",
    cost: 4,
    rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "DM_CORRUPTION_SPREAD" }],
    flavor: "黑暗不急著殺死你，它更喜歡看著你一點一點腐爛。",
  },

  {
    id: "DM16",
    type: "equipment",
    name: "黑暗能量核心",
    cost: 3,
    rarity: "uncommon",
    slot: "trinket",
    modifiers: { atk: 3 },
    passive: [{ kind: "scripted", tag: "DM_ENERGY_CORE_PASSIVE" }],
    flavor: "凝縮的黑暗次元能量，每次打擊都在擴大裂縫。",
  },

  {
    id: "DM17",
    type: "field",
    name: "黑暗次元裂縫",
    cost: 3,
    rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "DM_RIFT_FIELD" }],
    flavor: "次元壁開始崩解，每個回合都有更多的黑暗從縫隙中湧入。",
  },

  {
    id: "DM18",
    type: "field",
    name: "焦黑荒原",
    cost: 3,
    rarity: "uncommon",
    effects: [{ kind: "scripted", tag: "DM_SCORCHED_FIELD" }],
    flavor: "炎魔走過之地，生命不再生長——只有灰燼與黑暗能量殘留。",
  },

  // ── 惡魔類：稀有精英 ─────────────────────────────────────────────────────

  {
    id: "DM07",
    type: "troop",
    name: "咒魔軍師",
    cost: 4,
    rarity: "rare",
    hp: 14,
    atk: 4,
    def: 5,
    keywords: [],
    onPlay: [
      { kind: "summon", cardId: "DM01", count: 2, side: "self" },
    ],
    passive: [{ kind: "scripted", tag: "DM_CURSE_GENERAL_AURA" }],
    flavor: "從戰場亡魂怨念中誕生，它了解戰場上所有的痛苦——並懂得如何製造更多。",
  },

  {
    id: "DM08",
    type: "troop",
    name: "巨魔先鋒",
    cost: 6,
    rarity: "rare",
    hp: 35,
    atk: 10,
    def: 5,
    keywords: ["menace"],
    onPlay: [
      {
        kind: "damage",
        target: { kind: "all", filter: { side: "enemy", entity: "troop" } },
        amount: { kind: "const", value: 5 },
      },
    ],
    flavor: "七至十公尺的龐然大物。它不需要戰術，它本身就是戰術。",
  },

  {
    id: "DM15",
    type: "action",
    name: "次元斬",
    cost: 4,
    rarity: "rare",
    effects: [
      {
        kind: "damage",
        target: { kind: "single", filter: { side: "enemy", entity: "any" } },
        amount: { kind: "atk", mult: 2 },
        ignoreDef: true,
      },
      { kind: "stability", delta: -10 },
    ],
    flavor: "這一刀劃破的不只是血肉，更是現界與黑暗次元之間最後的屏障。",
  },

  // ── 傳說 ─────────────────────────────────────────────────────────────────

  {
    id: "DM19",
    type: "spell",
    name: "黑暗降臨",
    cost: 7,
    rarity: "legendary",
    effects: [{ kind: "scripted", tag: "DM_DARK_DESCENT" }],
    flavor: "魔帝雖死，其殘影仍在黑暗次元中游蕩，等待召喚它歸來的那一刻。",
  },

  {
    id: "DM20",
    type: "troop",
    name: "末日巨魔",
    cost: 8,
    rarity: "legendary",
    hp: 40,
    atk: 14,
    def: 6,
    keywords: ["guard", "menace"],
    onPlay: [
      {
        kind: "damage",
        target: { kind: "all", filter: { side: "enemy", entity: "any" } },
        amount: { kind: "const", value: 10 },
      },
    ],
    passive: [{ kind: "scripted", tag: "DM_DOOM_GIANT_SPELL_IMMUNE" }],
    flavor: "傳說中末日之戰的先驅，連天空都在它的腳步下顫抖。",
  },
];
