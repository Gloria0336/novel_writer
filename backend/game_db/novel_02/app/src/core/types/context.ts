import type { Card } from "./card";
import type { ClassFrame, HeroDefinition, RaceFrame } from "./hero";

export interface BattleContext {
  getCard: (cardId: string) => Card;
  getHero: (heroId: string) => HeroDefinition;
  getRace: (raceId: string) => RaceFrame;
  getClass: (classId: string) => ClassFrame;
}
