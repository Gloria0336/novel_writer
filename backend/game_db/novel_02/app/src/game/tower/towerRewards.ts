import type { HeroInstance } from "../../core/types/hero";
import type { TowerReward } from "./types";
import { nextRng, rngPick } from "../../core/deck/prng";

/**
 * 試煉塔獎勵池（v1）：
 * - 一定包含 1 個保底回血選項
 * - 另外 2 個從加卡 / 提升上限 / 增傷中隨機抽取
 */
const ADD_CARD_POOL: string[] = [
  "T01", "T02", "T03", "T04", "T05",     // 通用兵力
  "A01", "A02", "A03", "A04",            // 通用行動
  "S01", "S02", "S03", "S04",            // 通用法術
  "E03", "E04", "E05",                   // 通用裝備
];

export function generateRewards(rngState: number, floor: number): { rewards: TowerReward[]; nextRngState: number } {
  // 保底治療：金額隨樓層遞增（floor 1 → +20，floor 30 → +40）
  const healAmount = 20 + Math.floor(floor / 3);
  const rewards: TowerReward[] = [{ kind: "heal", amount: healAmount }];

  let s = rngState;

  // 第 2 格：加卡
  const card = rngPick(s, ADD_CARD_POOL);
  s = card.state;
  rewards.push({ kind: "addCard", cardId: card.value });

  // 第 3 格：buff
  const r = nextRng(s);
  s = r.state;
  if (r.value < 0.5) {
    rewards.push({ kind: "buffMaxHp", amount: 8 + Math.floor(floor / 4) });
  } else {
    rewards.push({ kind: "buffAtk", amount: 1 + Math.floor(floor / 8) });
  }

  return { rewards, nextRngState: s };
}

/** 把獎勵套用到英雄快照 / 牌組（純函式，回傳新值）。 */
export function applyReward(
  reward: TowerReward,
  hero: HeroInstance,
  deckIds: string[],
): { hero: HeroInstance; deckIds: string[] } {
  switch (reward.kind) {
    case "heal": {
      const next = { ...hero, hp: Math.min(hero.maxHp, hero.hp + reward.amount) };
      return { hero: next, deckIds };
    }
    case "buffMaxHp": {
      const next = { ...hero, maxHp: hero.maxHp + reward.amount, hp: hero.hp + reward.amount };
      return { hero: next, deckIds };
    }
    case "buffAtk": {
      const next = { ...hero, atk: hero.atk + reward.amount };
      return { hero: next, deckIds };
    }
    case "addCard": {
      return { hero, deckIds: [...deckIds, reward.cardId] };
    }
  }
}

export function describeReward(reward: TowerReward): string {
  switch (reward.kind) {
    case "heal": return `回復 ${reward.amount} HP`;
    case "buffMaxHp": return `最大 HP +${reward.amount}（同時回復同量）`;
    case "buffAtk": return `ATK +${reward.amount}`;
    case "addCard": return `加入牌組：${reward.cardId}`;
  }
}
