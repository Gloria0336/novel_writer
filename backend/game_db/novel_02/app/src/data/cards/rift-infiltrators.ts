import type { TroopCard } from "../../core/types/card";

/**
 * 次元滲透裂縫滲透體 T_s_35–T_s_40（v3.3 新增）
 *
 * 來源：rift_slot_design_v1.md §3.3。
 * 取自 `bible/demonology.yaml` 的惡魔類（demon_class）與原生類（native_class），不使用魔化類（corrupted_class）。
 * 僅敵方可用——由次元滲透裂縫機制（resource/rift.ts triggerInfiltration）自動召出，玩家牌庫不可加入。
 *
 * 數值原則：對標 T_h_03 帝國弩砲（4 費 12/9/2）等既有卡，滲透體略偏強以體現「黑暗次元入侵」威脅。
 * 進入裂縫位時自動套用 ATK ×2、DEF +5 加成（applyRiftBuff），表中 stats 為未加成基準值。
 *
 * 池規則（rift.ts selectInfiltratorPool）：
 *   - 回合 1–4：T_s_35–T_s_36
 *   - 回合 5–8：T_s_35–T_s_38
 *   - 回合 9+：T_s_35–T_s_40
 *   - F_c_08 加強裂縫：池往上一階
 *
 * 同卡上限：T_s_35–T_s_40 同一場戰鬥各最多召喚 2 次（RIFT_SAME_CARD_LIMIT）。
 */
export const RIFT_INFILTRATOR_CARDS: TroopCard[] = [
  {
    id: "T_s_35",
    type: "troop",
    name: "黑暗史萊姆",
    cost: 1,
    rarity: "common",
    hp: 8,
    atk: 3,
    def: 1,
    keywords: [],
    onDestroy: [
      // 〔謝幕曲〕對隨機 1 名玩家方單位造成 2 腐蝕傷害（無視 DEF）
      {
        kind: "damage",
        target: { kind: "random", filter: { side: "player", entity: "any" }, count: 1 },
        amount: { kind: "const", value: 2 },
        ignoreDef: true,
      },
    ],
    flavor: "無形之物從裂痕滲出，吞噬接觸到的一切。",
  },
  {
    id: "T_s_36",
    type: "troop",
    name: "觸手蠕行體",
    cost: 2,
    rarity: "common",
    hp: 12,
    atk: 5,
    def: 2,
    keywords: [],
    // 設計卡：攻擊殘血目標額外 +3 腐蝕傷害（MVP 簡化：純數值，passive 留 Stage 3）
    flavor: "裂縫對面伸出的，未必是一隻手。",
  },
  {
    id: "T_s_37",
    type: "troop",
    name: "古魔咆哮者",
    cost: 3,
    rarity: "uncommon",
    hp: 15,
    atk: 8,
    def: 2,
    keywords: ["rush"],
    onPlay: [
      // 〔入場曲〕對玩家英雄造成 3 純黑暗傷害（無視 DEF）
      {
        kind: "damage",
        target: { kind: "playerHero" },
        amount: { kind: "const", value: 3 },
        ignoreDef: true,
      },
    ],
    flavor: "不可名狀者沒有名字，也不需要名字。它只認得殺戮。",
  },
  {
    id: "T_s_38",
    type: "troop",
    name: "夢魔影刺",
    cost: 4,
    rarity: "uncommon",
    hp: 10,
    atk: 9,
    def: 1,
    keywords: ["haste"],
    // 設計卡：〔入場曲〕使玩家英雄下回合無法施放鬥志技能（MVP 簡化：純疾走，debuff flag 留 Stage 3）
    flavor: "兩條觸手是初出茅廬。八條觸手者，曾在七位帝王的夢中漫步。",
  },
  {
    id: "T_s_39",
    type: "troop",
    name: "冰魔施法者",
    cost: 5,
    rarity: "rare",
    hp: 14,
    atk: 6,
    def: 3,
    keywords: [],
    onPlay: [
      // 〔入場曲〕對所有玩家兵力造成 3 冰系傷害並使其下回合 ATK -2
      {
        kind: "damage",
        target: { kind: "all", filter: { side: "player", entity: "troop" } },
        amount: { kind: "const", value: 3 },
      },
      {
        kind: "buff",
        target: { kind: "all", filter: { side: "player", entity: "troop" } },
        mod: { atk: -2 },
        duration: { kind: "turns", count: 1 },
      },
    ],
    flavor: "她的肌膚冷如月宮殘骸，她的咒語不需要話語。",
  },
  {
    id: "T_s_40",
    type: "troop",
    name: "巨魔碎牆者",
    cost: 6,
    rarity: "rare",
    hp: 22,
    atk: 9,
    def: 7,
    keywords: ["guard"],
    flavor: "它七公尺高，但裂縫無視高度。",
  },
];
