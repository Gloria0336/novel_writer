import { rngShuffle } from "./prng";
import type { SideState } from "../types/battle";

export const HAND_LIMIT = 9;

export interface DrawResult {
  newRngState: number;
  drawn: number;
}

export function drawCards(side: SideState, count: number, rngState: number): DrawResult {
  let drawn = 0;
  let s = rngState;
  for (let i = 0; i < count; i++) {
    if (side.deck.length === 0) {
      // 重洗墓地進牌庫
      if (side.graveyard.length === 0) break;
      const r = rngShuffle(s, side.graveyard);
      s = r.state;
      side.deck = r.value;
      side.graveyard = [];
    }
    const card = side.deck.shift();
    if (!card) break;
    if (side.hand.length < HAND_LIMIT) {
      side.hand.push(card);
      drawn++;
    } else {
      // 超出手牌上限，棄掉
      side.graveyard.push(card);
    }
  }
  return { newRngState: s, drawn };
}
