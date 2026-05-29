import type { RaceGroup, ResourceKind, Side, TechCategory } from "./types";

export const SIDE_LABELS: Record<Side, string> = {
  human: "人類",
  monster: "魔物"
};

export const CATEGORY_LABELS: Record<TechCategory, string> = {
  gene: "基因強化",
  weapon: "武器",
  fortification: "工事",
  recon: "偵察",
  evolution: "進化",
  monster_research: "科研",
  logistics: "後勤"
};

export const CATEGORY_COLORS: Record<TechCategory, string> = {
  gene: "#6f9c62",
  weapon: "#c44d63",
  fortification: "#8b6a22",
  recon: "#4e82be",
  evolution: "#a7374e",
  monster_research: "#7b52ab",
  logistics: "#674aa5"
};

export const RACE_GROUP_LABELS: Record<RaceGroup, string> = {
  greenskins: "綠皮種族",
  fleshes: "血肉族",
  fures: "獸族",
  undeads: "不死族",
  demons: "魔族"
};

export const RACE_GROUP_COLORS: Record<RaceGroup, string> = {
  greenskins: "#5a8a3c",
  fleshes: "#b84d6a",
  fures: "#9a5c28",
  undeads: "#4e6080",
  demons: "#8a2a5a"
};

export const RESOURCE_LABELS: Record<ResourceKind, string> = {
  research_point: "研究點",
  combat_resource: "戰鬥資源",
  monster_source: "魔物源",
  slave: "奴隸"
};

// 效果鍵的中文標籤；未列出的鍵以原鍵名顯示。
export const EFFECT_LABELS: Record<string, string> = {
  // 通用數值
  hp_mult: "HP 倍率",
  attack_mult: "攻擊倍率",
  defense_mult: "防禦倍率",
  upkeep_reduction: "維持成本減免",
  fortification_add: "工事增益",
  intel_clarity: "情報清晰度",
  concealment: "隱蔽",
  movement: "行軍",
  horde_bonus: "群體加成",

  // 種族專屬數值
  greenskin_attack_mult: "綠皮攻擊倍率",
  greenskin_horde_bonus: "綠皮群體加成",
  flesh_hp_mult: "血肉 HP 倍率",
  flesh_defense_mult: "血肉防禦倍率",
  flesh_split_threshold: "血肉分裂閾值",
  fures_attack_mult: "獸族攻擊倍率",
  fures_defense_mult: "獸族防禦倍率",
  fures_frenzy_threshold: "獸族狂暴閾值",
  undead_hp_mult: "不死 HP 倍率",
  undead_regen: "不死再生率",
  demon_attack_mult: "魔族攻擊倍率",
  demon_fear_mult: "魔族恐懼倍率",

  // 解鎖物種 — 綠皮種族
  unlock_species_goblin: "解鎖：哥布林",
  unlock_species_kappa: "解鎖：河童",
  unlock_species_elite_goblin: "解鎖：精英哥布林",
  unlock_species_goblin_shaman: "解鎖：哥布林祭司",
  unlock_species_hobgoblin: "解鎖：霍布地精",
  unlock_species_orc: "解鎖：半獸人",
  unlock_species_troll: "解鎖：巨魔",

  // 解鎖物種 — 血肉族
  unlock_species_slime: "解鎖：史萊姆",
  unlock_species_tentacle_beast: "解鎖：觸手怪",
  unlock_species_elemental_slime: "解鎖：元素史萊姆",
  unlock_species_specialized_slime: "解鎖：特化史萊姆",
  unlock_species_oblex: "解鎖：歐布萊克斯",
  unlock_species_the_rotten: "解鎖：腐者",

  // 解鎖物種 — 獸族
  unlock_species_werewolf: "解鎖：狼人",
  unlock_species_bigfoot: "解鎖：大腳怪",
  unlock_species_minotaur: "解鎖：牛頭人",
  unlock_species_yeti: "解鎖：雪怪",

  // 解鎖物種 — 不死族
  unlock_species_skeleton: "解鎖：骷髏",
  unlock_species_zombie: "解鎖：殭屍",
  unlock_species_mummy: "解鎖：木乃伊",
  unlock_species_vampire: "解鎖：吸血鬼",

  // 解鎖物種 — 魔族
  unlock_species_demon: "解鎖：惡魔",
  unlock_species_succubus: "解鎖：魅魔",
  unlock_species_balrog: "解鎖：炎魔"
};
