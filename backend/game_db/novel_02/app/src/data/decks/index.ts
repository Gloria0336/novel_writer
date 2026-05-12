import { AELLA_FLAIR_DECK_IDS, ARCHMAGE_DECK_IDS, BLOOD_CHIEF_DECK_IDS, COMMANDER_DECK_IDS, buildDeck } from "./starter";

export const STARTER_DECKS: Record<string, string[]> = {
  commander_legion: COMMANDER_DECK_IDS,
  archmage_grand: ARCHMAGE_DECK_IDS,
  bloodchief_savage: BLOOD_CHIEF_DECK_IDS,
  aella_flair: AELLA_FLAIR_DECK_IDS,
};

export function getStarterDeckIds(heroId: string): string[] {
  const ids = STARTER_DECKS[heroId];
  if (!ids) throw new Error(`No starter deck for hero ${heroId}`);
  return ids;
}

export { buildDeck };
