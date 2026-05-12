import type { ClassFrame, ClassId } from "../core/types/hero";

const COMMANDER: ClassFrame = {
  id: "commander",
  name: "指揮官",
  statMods: { hp: 0, atk: -2, def: 0, cmd: 2 },
  keyword: "command",
  description: "兵力越多，行動卡傷害與技能效果越強。",
};

const MAGE: ClassFrame = {
  id: "mage",
  name: "法師",
  statMods: { hp: -10, atk: 0, def: -1, cmd: 0 },
  keyword: "overload",
  description: "本回合使用第 3 張法術起，每張額外 +1 點臨時魔力。",
};

const SMITH: ClassFrame = {
  id: "smith",
  name: "鍛造師",
  statMods: { hp: 10, atk: 0, def: 2, cmd: 0 },
  keyword: "forge",
  description: "可消耗 1 魔力把手牌中 1 張非裝備卡轉為隨機裝備卡（每回合限 1 次）。",
};

const ILLUSIONIST: ClassFrame = {
  id: "illusionist",
  name: "幻術師",
  statMods: { hp: 0, atk: 1, def: 0, cmd: 0 },
  keyword: "phantom",
  description: "每回合可免費生成 1 個幻影兵力（HP 1 / ATK 0 / 守護）。",
};

const BERSERKER: ClassFrame = {
  id: "berserker",
  name: "狂戰士",
  statMods: { hp: 0, atk: 3, def: -2, cmd: 0 },
  keyword: "berserk",
  description: "行動卡傷害隨已損失 HP 百分比增加：每 -10% HP 額外 +8% 傷害。",
};

const PRIEST: ClassFrame = {
  id: "priest",
  name: "神官",
  statMods: { hp: 5, atk: -2, def: 1, cmd: 0 },
  keyword: "blessing",
  description: "恢復類效果（法術/技能）恢復量 +50%。",
};

const ADVENTURER: ClassFrame = {
  id: "adventurer",
  name: "冒險家",
  statMods: { hp: 2, atk: 1, def: -1, cmd: 0 },
  keyword: "command",
  description: "擅長偵查、救援與臨場支援，透過機動行動累積戰術優勢。",
};

export const CLASSES: Record<ClassId, ClassFrame> = {
  commander: COMMANDER,
  mage: MAGE,
  smith: SMITH,
  illusionist: ILLUSIONIST,
  berserker: BERSERKER,
  priest: PRIEST,
  adventurer: ADVENTURER,
};

export function getClass(id: ClassId): ClassFrame {
  return CLASSES[id];
}
