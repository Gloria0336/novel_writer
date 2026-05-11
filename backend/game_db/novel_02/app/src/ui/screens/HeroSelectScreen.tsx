import { useBattleData } from "../../game/useBattleData";

interface Props {
  onSelect: (heroId: string) => void;
}

export function HeroSelectScreen({ onSelect }: Props): JSX.Element {
  const heroes = useBattleData();
  return (
    <div className="hero-select">
      <h1>星落戰紀 — 核心驗證 MVP</h1>
      <p style={{ color: "#888" }}>選擇一位英雄，挑戰腐植巢穴</p>
      <div className="hero-options">
        {heroes.map((h) => (
          <button key={h.id} className="hero-option" onClick={() => onSelect(h.id)}>
            <h3>{h.name}</h3>
            <div className="meta">
              {h.raceName}·{h.className}·{h.rarity}
            </div>
            <div className="stats">
              HP {h.stats.hp} / ATK {h.stats.atk} / DEF {h.stats.def} / CMD {h.stats.cmd}
            </div>
            <div style={{ color: "#777", fontSize: 12, marginTop: 8 }}>{h.flavor}</div>
          </button>
        ))}
      </div>
      <p style={{ color: "#666", fontSize: 12 }}>v0.1 · 戰鬥系統開發中（M2 之後將開放完整對戰）</p>
    </div>
  );
}
