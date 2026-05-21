import type { DeviceCard } from "../../core/types/card";

/**
 * 通用魔導器具（device）T_m_01–T_m_07
 * 任何種族可組入牌庫。矮人鍛造師是這些卡的最佳使用者（爐火 cost-1 / device DEF +2 / 製造池），
 * 但「構裝體 / 哨兵 / 砲台 / 弩砲 / …」本身屬於跨種族的奧術工程產物。
 *
 * 機制代表（v4 重構）：
 * - T_m_01 修復構裝體：修復機制（onTurnStart 回滿自身）
 * - T_m_02 構裝哨兵：自動反應機制（敵方攻擊我方英雄時觸發暈眩）
 * - T_m_03 魔導砲台：onTurnStart 攻擊機制（每回合開始自動射擊）
 * - T_m_04 攻城弩砲：型態變化機制（待機高 DEF / 啟動高 ATK + siege）
 * - T_m_05 制裁機關：型態變化 + 暈眩
 * - T_m_06 共鳴增幅器：升級數值機制（每回合自我 +1/+1）
 * - T_m_07 守護結界塔：自動反應（敵方施法時己方兵力 +2 DEF）
 *
 * 卡牌詳細效果在 Stage 6 完成。當前型別已升格為獨立 CardType="device"。
 */
export const DEVICES: DeviceCard[] = [
  {
    id: "T_m_01", type: "device", name: "修復構裝體", cost: 2, rarity: "common",
    occupiesTroopSlot: true,
    hp: 6, atk: 0, def: 2, keywords: [],
    onTurnStart: [{ kind: "scripted", tag: "DEVICE_REPAIR_SELF" }],
    onTurnEnd: [{ kind: "heal", target: { kind: "all", filter: { side: "self", entity: "troop" } }, amount: { kind: "const", value: 3 } }],
    flavor: "奧術工匠協會的標準維護型號。沒有靈魂，但極其忠誠。",
  },
  {
    id: "T_m_02", type: "device", name: "構裝哨兵", cost: 3, rarity: "uncommon",
    occupiesTroopSlot: true,
    hp: 15, atk: 4, def: 8, keywords: ["guard"],
    onReaction: [{
      on: "enemyHeroAttacked",
      effects: [{ kind: "freeze", target: { kind: "all", filter: { side: "enemy", entity: "troop" } }, turns: 1, displayName: "暈眩" }],
    }],
    passive: [{ kind: "scripted", tag: "HERO_DEF_PLUS_2_WHILE_ALIVE" }],
    flavor: "城牆會睡，它不會。",
  },
  {
    id: "T_m_03", type: "device", name: "魔導砲台", cost: 4, rarity: "uncommon",
    occupiesTroopSlot: true,
    hp: 20, atk: 8, def: 6, keywords: [],
    onTurnStart: [{ kind: "scripted", tag: "AUTO_TURRET_FIRE" }],
    passive: [{ kind: "scripted", tag: "IMMUNE_SPELL_DAMAGE" }],
    flavor: "把法陣壓進金屬，把咒語化作彈道。",
  },
  {
    id: "T_m_04", type: "device", name: "攻城弩砲", cost: 5, rarity: "rare",
    occupiesTroopSlot: true,
    hp: 25, atk: 6, def: 12, keywords: ["guard"],
    form: {
      idle: { atk: 6, def: 12, keywords: ["guard"] },
      active: { atk: 14, def: 6, keywords: ["siege"] },
    },
    flavor: "不為斬將，只為破門。",
  },
  {
    id: "T_m_05", type: "device", name: "制裁機關", cost: 4, rarity: "rare",
    occupiesTroopSlot: true,
    hp: 14, atk: 5, def: 4, keywords: [],
    form: {
      idle: { atk: 3, def: 8, keywords: ["guard"] },
      active: { atk: 9, def: 2, keywords: [] },
    },
    onTurnStart: [{ kind: "scripted", tag: "SANCTION_MECHANISM_STRIKE" }],
    flavor: "齒輪轉動的那一刻，審判落下。",
  },
  {
    id: "T_m_06", type: "device", name: "共鳴增幅器", cost: 3, rarity: "uncommon",
    occupiesTroopSlot: true,
    hp: 10, atk: 2, def: 3, keywords: [],
    upgradeable: { maxLevel: 5, perLevel: { atk: 1, def: 1 } },
    onTurnStart: [{ kind: "scripted", tag: "DEVICE_SELF_UPGRADE" }],
    flavor: "每一次震動，都讓它更接近完美的頻率。",
  },
  {
    id: "T_m_07", type: "device", name: "守護結界塔", cost: 5, rarity: "rare",
    occupiesTroopSlot: true,
    hp: 18, atk: 0, def: 10, keywords: ["guard"],
    onReaction: [{
      on: "enemySpellCast",
      effects: [{ kind: "buff", target: { kind: "all", filter: { side: "self", entity: "troop" } }, mod: { def: 2 }, duration: { kind: "thisTurn" } }],
    }],
    flavor: "符文每展開一次，就吞下一道咒語。",
  },
];

/** 鍛造師「製造器具」可抽取的池。 */
export const DEVICE_POOL: string[] = DEVICES.map((d) => d.id);
