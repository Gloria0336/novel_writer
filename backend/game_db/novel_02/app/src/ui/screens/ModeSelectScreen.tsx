interface Props {
  heroName: string;
  onSinglePick: () => void;
  onTowerStart: () => void;
  onBack: () => void;
}

export function ModeSelectScreen({ heroName, onSinglePick, onTowerStart, onBack }: Props): JSX.Element {
  return (
    <div className="hero-select" style={{ paddingTop: 40 }}>
      <h1>選擇模式</h1>
      <p style={{ color: "#888" }}>當前英雄：{heroName}</p>
      <div className="hero-options" style={{ gridTemplateColumns: "1fr 1fr", maxWidth: 880 }}>
        <button className="hero-option" onClick={onSinglePick}>
          <h3>單場戰鬥</h3>
          <div className="meta">挑選任一巢穴或 Boss 直接對戰</div>
          <div style={{ color: "#777", fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>
            6 座巢穴：腐植 / 蟲族 / 魔獸 / 暗影 / 晶體 / 腐化神殿。<br/>
            6 位 Boss：惡魔將領 / 夢魔宗主 / 古魔 / 妖族叛王 / 炎魔 / 獸王。
          </div>
        </button>
        <button className="hero-option" onClick={onTowerStart}>
          <h3>試煉塔（30 層）</h3>
          <div className="meta">Roguelike — 每勝利後三選一獎勵</div>
          <div style={{ color: "#777", fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>
            前 4、6-9、11-14… 為巢穴；每 5 層 Boss。<br/>
            難度遞增，每層觸發天象事件，HP 跨層保留。
          </div>
        </button>
      </div>
      <button onClick={onBack} style={{ marginTop: 32, padding: "10px 24px", background: "#222", color: "#ccc", border: "1px solid #444", borderRadius: 6, cursor: "pointer" }}>
        ← 重新選擇英雄
      </button>
    </div>
  );
}
