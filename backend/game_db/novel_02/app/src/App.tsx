import { useState } from "react";
import { HeroSelectScreen } from "./ui/screens/HeroSelectScreen";
import { BattleScreen } from "./ui/screens/BattleScreen";

export function App(): JSX.Element {
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);

  if (!selectedHeroId) {
    return <HeroSelectScreen onSelect={setSelectedHeroId} />;
  }
  return <BattleScreen heroId={selectedHeroId} onExit={() => setSelectedHeroId(null)} />;
}
