import { rngShuffle } from "./prng";
import type { SideState } from "../types/battle";

export const HAND_LIMIT = 9;

export interface DrawResult {
  newRngState: number;
  drawn: number;
}

export interface DrawPredicate {
  cardIdPrefixes?: string[];
  cardIdIncludes?: string[];
}

export function drawCards(side: SideState, count: number, rngState: number, predicate?: DrawPredicate): DrawResult {
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
    const drawIndex = predicate ? side.deck.findIndex((card) => matchesDrawPredicate(card.cardId, predicate)) : 0;
    if (drawIndex < 0) break;
    const [card] = side.deck.splice(drawIndex, 1);
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

function matchesDrawPredicate(cardId: string, predicate: DrawPredicate): boolean {
  return (
    predicate.cardIdPrefixes?.some((prefix) => cardId.startsWith(prefix)) === true ||
    predicate.cardIdIncludes?.some((part) => cardId.includes(part)) === true
  );
}
