import { useTowerRun } from "../../game/tower/TowerRunProvider";
import { getFloorEntry, OMEN_DEFS } from "../../game/tower/towerData";
import { scaleForFloor } from "../../game/tower/towerScaling";
import { getEnemy } from "../../data/enemies";

interface Props {
  onEnterBattle: () => void;
  onAbandon: () => void;
}

export function TowerRunScreen({ onEnterBattle, onAbandon }: Props): JSX.Element {
  const { run, enterFloor, abandon } = useTowerRun();
  if (!run) return <div style={{ padding: 32, color: "#ccc" }}>沒有進行中的試煉。</div>;

  const entry = getFloorEntry(run.floor);
  const enemy = getEnemy(entry.enemyId);
  const scale = scaleForFloor(entry);
  const omen = run.activeOmen ? OMEN_DEFS[run.activeOmen] : null;

  return (
    <div className="hero-select" style={{ paddingTop: 24 }}>
      <h1>試煉塔 — 第 {run.floor} / 30 層</h1>
      <p style={{ color: "#aaa" }}>{entry.kind === "boss" ? "★ Boss 戰" : "巢穴攻城"}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 16, maxWidth: 900 }}>
        <div style={{ background: "#1a1a1a", border: "1px solid #444", borderRadius: 8, padding: 20 }}>
          <h2 style={{ color: "#f1c40f", fontSize: 22 }}>{enemy.name}</h2>
          <p style={{ color: "#aaa", fontSize: 13 }}>{enemy.description}</p>
          <p style={{ color: "#888", fontSize: 12, marginTop: 12 }}>
            放大係數：HP ×{scale.hpMult.toFixed(2)} / ATK ×{scale.atkMult.toFixed(2)}
          </p>
        </div>

        <div style={{ background: "#1a1a1a", border: "1px solid #444", borderRadius: 8, padding: 20 }}>
          <h2 style={{ color: "#3498db", fontSize: 22 }}>當前狀態</h2>
          <p style={{ color: "#ccc", fontSize: 14 }}>
            英雄 HP：{run.heroSnapshot.hp} / {run.heroSnapshot.maxHp}<br/>
            ATK {run.heroSnapshot.atk} / DEF {run.heroSnapshot.def} / CMD {run.heroSnapshot.cmd}<br/>
            牌組張數：{run.deckIds.length}<br/>
            累計獎勵：{run.rewardsTaken.length} 個
          </p>
          {omen ? (
            <div style={{ marginTop: 12, padding: 12, background: "#2a1a2a", border: "1px solid #6a3a6a", borderRadius: 6 }}>
              <div style={{ color: "#e0a8e0", fontSize: 14, fontWeight: "bold" }}>天象：{omen.name}</div>
              <div style={{ color: "#bbb", fontSize: 12, marginTop: 4 }}>{omen.description}</div>
            </div>
          ) : <p style={{ color: "#666", fontSize: 12, marginTop: 12 }}>本層無天象事件。</p>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
        <button onClick={() => { enterFloor(); onEnterBattle(); }} style={{ padding: "12px 32px", background: "#c0392b", color: "white", border: "none", borderRadius: 6, fontSize: 16, cursor: "pointer" }}>
          開始戰鬥
        </button>
        <button onClick={() => { abandon(); onAbandon(); }} style={{ padding: "12px 24px", background: "#222", color: "#ccc", border: "1px solid #444", borderRadius: 6, cursor: "pointer" }}>
          放棄試煉
        </button>
      </div>

      {run.history.length > 0 && (
        <div style={{ marginTop: 32, maxWidth: 900 }}>
          <h3 style={{ color: "#888", fontSize: 14 }}>戰史</h3>
          <ul style={{ color: "#666", fontSize: 12, lineHeight: 1.8 }}>
            {run.history.map((h, i) => (
              <li key={i}>第 {h.floor} 層：{h.enemyId} — {h.outcome === "win" ? "勝利" : "失敗"}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
