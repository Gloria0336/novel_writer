import { useTowerRun } from "../../game/tower/TowerRunProvider";

interface Props {
  onExit: () => void;
}

export function TowerOutcomeScreen({ onExit }: Props): JSX.Element {
  const { run, abandon } = useTowerRun();
  if (!run) return <div style={{ padding: 32, color: "#ccc" }}>無進行中的試煉。</div>;
  const isWin = run.status === "won";

  return (
    <div className="hero-select" style={{ paddingTop: 40 }}>
      <h1 style={{ color: isWin ? "#f1c40f" : "#e74c3c" }}>
        {isWin ? "★ 試煉塔通關！" : "試煉失敗"}
      </h1>
      <p style={{ color: "#aaa", fontSize: 18 }}>
        通過樓層：{run.floor}{isWin ? " / 30" : ""}
      </p>
      <p style={{ color: "#888", marginTop: 8 }}>
        累計獎勵：{run.rewardsTaken.length} 個 · 牌組張數：{run.deckIds.length}
      </p>

      <div style={{ marginTop: 24, maxWidth: 720, textAlign: "left" }}>
        <h3 style={{ color: "#888", fontSize: 14 }}>戰史</h3>
        <ul style={{ color: "#888", fontSize: 13, lineHeight: 1.8 }}>
          {run.history.map((h, i) => (
            <li key={i}>第 {h.floor} 層：{h.enemyId} — {h.outcome === "win" ? "勝利" : "失敗"}</li>
          ))}
        </ul>
      </div>

      <button onClick={() => { abandon(); onExit(); }} style={{ marginTop: 32, padding: "12px 28px", background: "#c0392b", color: "white", border: "none", borderRadius: 6, fontSize: 16, cursor: "pointer" }}>
        返回主畫面
      </button>
    </div>
  );
}
