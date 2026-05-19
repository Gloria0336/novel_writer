interface Props {
  heroName: string;
  onSinglePick: () => void;
  onTowerStart: () => void;
  onDeckPreview: () => void;
  onBack: () => void;
}

export function ModeSelectScreen({ heroName, onSinglePick, onTowerStart, onDeckPreview, onBack }: Props): JSX.Element {
  return (
    <div className="hero-select" style={{ paddingTop: 40 }}>
      <h1>選擇關卡流程</h1>
      <p style={{ color: "#aaa" }}>當前英雄：{heroName}</p>
      <div className="hero-options" style={{ maxWidth: 940 }}>
        <button className="hero-option" onClick={onSinglePick}>
          <h3>單場戰鬥</h3>
          <div className="meta">選擇巢穴或 Boss，立即進入完整對戰。</div>
          <div style={{ color: "#999", fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>
            適合快速測試英雄、卡牌節奏與單一敵人的壓力。
          </div>
        </button>

        <button className="hero-option" onClick={onTowerStart}>
          <h3>高塔挑戰 · 30 層</h3>
          <div className="meta">Roguelike 連戰流程，沿途取得獎勵並調整牌組。</div>
          <div style={{ color: "#999", fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>
            每 5 層遭遇 Boss，英雄 HP 與牌組會延續到下一層。
          </div>
        </button>

        <button className="hero-option" onClick={onDeckPreview}>
          <h3>查看英雄牌組</h3>
          <div className="meta">確認所選英雄的起始牌組、卡牌效果與英雄技能。</div>
          <div style={{ color: "#999", fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>
            進入戰鬥前可以先檢視每張可用卡牌的費用、類型、稀有度與完整效果文字。
          </div>
        </button>
      </div>
      <button
        onClick={onBack}
        style={{ marginTop: 20, padding: "10px 24px", background: "#222", color: "#ccc", border: "1px solid #444", borderRadius: 6, cursor: "pointer" }}
      >
        返回英雄選擇
      </button>
    </div>
  );
}
