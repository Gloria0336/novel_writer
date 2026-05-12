import { ELNO_HONORARY_MAGE_DECK_IDS, LULU_DECK_IDS, MOUNTAIN_HUNTER_DECK_IDS, REKA_DECK_IDS, buildDeck } from "./starter";

export const STARTER_DECKS: Record<string, string[]> = {
  lulu: LULU_DECK_IDS,
  "mountain-hunter": MOUNTAIN_HUNTER_DECK_IDS,
  reka: REKA_DECK_IDS,
  "elno-honorary-mage": ELNO_HONORARY_MAGE_DECK_IDS,
};

export function getStarterDeckIds(heroId: string): string[] {
  const ids = STARTER_DECKS[heroId];
  if (!ids) throw new Error(`No starter deck for hero ${heroId}`);
  return ids;
}

export { buildDeck };
