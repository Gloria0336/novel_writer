import { ENEMY_LIST } from "../../data/enemies";

interface Props {
  onSelect: (enemyId: string) => void;
  onBack: () => void;
}

export function EnemySelectScreen({ onSelect, onBack }: Props): JSX.Element {
  const lairs = ENEMY_LIST.filter((e) => e.kind === "lair");
  const bosses = ENEMY_LIST.filter((e) => e.kind === "boss");

  return (
    <div className="hero-select" style={{ paddingTop: 32 }}>
      <h1>選擇敵人</h1>

      <h2 style={{ color: "#aaa", marginTop: 16, fontSize: 18 }}>巢穴（§E.2）</h2>
      <div className="hero-options">
        {lairs.map((e) => (
          <button key={e.id} className="hero-option" onClick={() => onSelect(e.id)}>
            <h3>{e.name}</h3>
            <div className="meta">{e.heroDef.raceId} · 巢穴</div>
            <div style={{ color: "#777", fontSize: 12, marginTop: 8 }}>{e.description}</div>
          </button>
        ))}
      </div>

      <h2 style={{ color: "#aaa", marginTop: 24, fontSize: 18 }}>Boss（§E.1）</h2>
      <div className="hero-options">
        {bosses.map((e) => (
          <button key={e.id} className="hero-option" onClick={() => onSelect(e.id)}>
            <h3>{e.name}</h3>
            <div className="meta">{e.heroDef.raceId} · {e.heroDef.classId}</div>
            <div style={{ color: "#777", fontSize: 12, marginTop: 8 }}>{e.description}</div>
          </button>
        ))}
      </div>

      <button onClick={onBack} style={{ marginTop: 24, padding: "10px 24px", background: "#222", color: "#ccc", border: "1px solid #444", borderRadius: 6, cursor: "pointer" }}>
        ← 返回模式選擇
      </button>
    </div>
  );
}
