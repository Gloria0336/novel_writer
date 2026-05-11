export type Keyword =
  | "guard"      // 守護
  | "rush"       // 突進
  | "haste"      // 疾走
  | "lethal"     // 必殺
  | "lifesteal"  // 汲取
  | "menace"     // 威壓
  | "pierce"     // 穿透
  | "frozen";    // 凍結（狀態，非卡牌固有）

export type ClassKeyword =
  | "command"     // 號令
  | "overload"    // 超載
  | "forge"       // 改造
  | "phantom"     // 幻影
  | "berserk"     // 狂暴
  | "blessing";   // 祝福

export const KEYWORD_LABEL: Record<Keyword, string> = {
  guard: "守護",
  rush: "突進",
  haste: "疾走",
  lethal: "必殺",
  lifesteal: "汲取",
  menace: "威壓",
  pierce: "穿透",
  frozen: "凍結",
};

export const CLASS_KEYWORD_LABEL: Record<ClassKeyword, string> = {
  command: "號令",
  overload: "超載",
  forge: "改造",
  phantom: "幻影",
  berserk: "狂暴",
  blessing: "祝福",
};
