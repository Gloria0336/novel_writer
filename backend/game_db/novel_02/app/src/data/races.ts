import type { RaceFrame, RaceId } from "../core/types/hero";

const HUMAN: RaceFrame = {
  id: "human",
  name: "人類",
  statMods: { hp: 0, atk: -2, def: 0, cmd: 2 },
  gauge: { id: "command", name: "軍令", max: 100, description: "與兵力部署和兵力存活相關的資源" },
  deckLimits: { troop: [14, 18], action: [4, 6], spell: [2, 4], equipment: [2, 3], field: [1, 2] },
  description: "兵力之子。軍令凝聚意志，軍團越聚越強。",
};

const ELF: RaceFrame = {
  id: "elf",
  name: "精靈",
  statMods: { hp: -10, atk: -3, def: -1, cmd: -1 },
  gauge: { id: "resonance", name: "共鳴", max: 10, description: "與法術施放相關的連鎖資源，每回合重置" },
  deckLimits: { troop: [3, 5], action: [4, 6], spell: [12, 16], equipment: [1, 2], field: [2, 4] },
  manaCap: 13,
  description: "魔力之嗣。法術連鎖如風暴，魔力上限超凡。",
};

const DWARF: RaceFrame = {
  id: "dwarf",
  name: "矮人",
  statMods: { hp: 20, atk: 0, def: 3, cmd: 0 },
  gauge: { id: "forge", name: "爐火", max: 100, description: "與裝備/器具的製造和升級相關的資源" },
  deckLimits: { troop: [4, 6], action: [5, 8], spell: [3, 5], equipment: [7, 10], field: [2, 3] },
  description: "鍛造之民。爐火淬煉鋼鐵，器械承載戰意。",
};

const FEY: RaceFrame = {
  id: "fey",
  name: "妖族",
  statMods: { hp: 5, atk: 1, def: 0, cmd: 0 },
  gauge: { id: "essence", name: "靈蘊", max: 100, description: "與形態切換相關的燃料資源" },
  deckLimits: { troop: [5, 8], action: [7, 10], spell: [5, 8], equipment: [2, 3], field: [1, 2] },
  description: "雙形之裔。人形隱於風月，妖形現於殺伐。",
};

const BEAST: RaceFrame = {
  id: "beast",
  name: "獸族",
  statMods: { hp: 30, atk: 6, def: -2, cmd: 0 },
  gauge: { id: "rage", name: "血怒", max: 10, description: "與英雄受傷/血量相關的攻擊力資源" },
  deckLimits: { troop: [5, 8], action: [10, 14], spell: [2, 4], equipment: [2, 3], field: [1, 2] },
  description: "蠻荒之爪。血流成河之時，最為致命。",
};

const DEMIGOD: RaceFrame = {
  id: "demigod",
  name: "半神族",
  statMods: { hp: 40, atk: 8, def: 3, cmd: -3 },
  gauge: { id: "divineEcho", name: "神力殘響", max: 100, description: "稀缺的強力資源，使用後有副作用" },
  deckLimits: { troop: [1, 3], action: [12, 16], spell: [3, 6], equipment: [3, 4], field: [1, 2] },
  description: "天神之後。一身敵千軍，但代價深遠。",
};

const DEMON: RaceFrame = {
  id: "demon",
  name: "惡魔",
  statMods: { hp: 30, atk: 4, def: 2, cmd: -2 },
  gauge: { id: "darkErosion", name: "黑暗蝕", max: 100, description: "從次元裂縫汲取黑暗能量；兵力被摧毀與攻擊命中皆會累積。滿值時穩定度 -10 並反噬玩家。" },
  deckLimits: { troop: [6, 10], action: [4, 8], spell: [4, 8], equipment: [1, 2], field: [1, 2] },
  description: "次元裂縫的造物。腐化既是武器、也是宿命。",
};

export const RACES: Record<RaceId, RaceFrame> = {
  human: HUMAN,
  elf: ELF,
  dwarf: DWARF,
  fey: FEY,
  beast: BEAST,
  demigod: DEMIGOD,
  demon: DEMON,
};

export function getRace(id: RaceId): RaceFrame {
  return RACES[id];
}
