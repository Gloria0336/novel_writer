import { useEffect, useState } from "react";
import { HeroSelectScreen } from "./ui/screens/HeroSelectScreen";
import { BattleScreen } from "./ui/screens/BattleScreen";
import { ModeSelectScreen } from "./ui/screens/ModeSelectScreen";
import { EnemySelectScreen } from "./ui/screens/EnemySelectScreen";
import { TowerRunScreen } from "./ui/screens/TowerRunScreen";
import { RewardSelectScreen } from "./ui/screens/RewardSelectScreen";
import { TowerOutcomeScreen } from "./ui/screens/TowerOutcomeScreen";
import { TowerRunProvider, useTowerRun } from "./game/tower/TowerRunProvider";
import { HEROES } from "./data/heroes";
import { getFloorEntry } from "./game/tower/towerData";
import { scaleForFloor } from "./game/tower/towerScaling";

type Stage =
  | { kind: "heroSelect" }
  | { kind: "modeSelect"; heroId: string }
  | { kind: "enemySelect"; heroId: string }
  | { kind: "singleBattle"; heroId: string; enemyId: string }
  | { kind: "tower"; heroId: string };

export function App(): JSX.Element {
  return (
    <TowerRunProvider>
      <AppInner />
    </TowerRunProvider>
  );
}

function AppInner(): JSX.Element {
  const [stage, setStage] = useState<Stage>({ kind: "heroSelect" });

  if (stage.kind === "heroSelect") {
    return <HeroSelectScreen onSelect={(heroId) => setStage({ kind: "modeSelect", heroId })} />;
  }

  if (stage.kind === "modeSelect") {
    const heroName = HEROES[stage.heroId]?.name ?? stage.heroId;
    return (
      <ModeSelectScreen
        heroName={heroName}
        onSinglePick={() => setStage({ kind: "enemySelect", heroId: stage.heroId })}
        onTowerStart={() => setStage({ kind: "tower", heroId: stage.heroId })}
        onBack={() => setStage({ kind: "heroSelect" })}
      />
    );
  }

  if (stage.kind === "enemySelect") {
    return (
      <EnemySelectScreen
        onSelect={(enemyId) => setStage({ kind: "singleBattle", heroId: stage.heroId, enemyId })}
        onBack={() => setStage({ kind: "modeSelect", heroId: stage.heroId })}
      />
    );
  }

  if (stage.kind === "singleBattle") {
    return (
      <BattleScreen
        heroId={stage.heroId}
        enemyId={stage.enemyId}
        onExit={() => setStage({ kind: "modeSelect", heroId: stage.heroId })}
      />
    );
  }

  // tower
  return (
    <TowerFlow
      heroId={stage.heroId}
      onExit={() => setStage({ kind: "modeSelect", heroId: stage.heroId })}
    />
  );
}

function TowerFlow({ heroId, onExit }: { heroId: string; onExit: () => void }): JSX.Element {
  const { run, startRun, finishBattle } = useTowerRun();

  useEffect(() => {
    if (!run || run.heroId !== heroId) startRun(heroId);
  }, [heroId, run, startRun]);

  if (!run || run.heroId !== heroId) {
    return <div style={{ padding: 32, color: "#ccc" }}>初始化試煉塔…</div>;
  }

  if (run.status === "preFloor") {
    return <TowerRunScreen onEnterBattle={() => { /* status 已切換為 inBattle */ }} onAbandon={onExit} />;
  }

  if (run.status === "inBattle") {
    const entry = getFloorEntry(run.floor);
    const scale = scaleForFloor(entry);
    return (
      <BattleScreen
        key={`tower-${run.floor}`}
        heroId={heroId}
        enemyId={entry.enemyId}
        initialPlayerHero={run.heroSnapshot}
        initialDeckIds={run.deckIds}
        enemyScale={scale}
        onExit={onExit}
        onBattleEnd={(result, finalState) => finishBattle(result, finalState)}
      />
    );
  }

  if (run.status === "rewardSelect") {
    return <RewardSelectScreen />;
  }

  // won / lost
  return <TowerOutcomeScreen onExit={onExit} />;
}
