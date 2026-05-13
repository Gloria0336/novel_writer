import { useTowerRun } from "../../game/tower/TowerRunProvider";
import { describeReward } from "../../game/tower/towerRewards";

export function RewardSelectScreen(): JSX.Element {
  const { run, applyChosenReward } = useTowerRun();
  if (!run || !run.pendingRewards) {
    return <div style={{ padding: 32, color: "#ccc" }}>無待選獎勵。</div>;
  }
  return (
    <div className="hero-select" style={{ paddingTop: 32 }}>
      <h1>勝利！第 {run.floor} 層通過</h1>
      <p style={{ color: "#aaa" }}>請從以下三項中擇一：</p>
      <div className="hero-options" style={{ gridTemplateColumns: "1fr 1fr 1fr", maxWidth: 900 }}>
        {run.pendingRewards.map((r, i) => (
          <button key={i} className="hero-option" onClick={() => applyChosenReward(r)}>
            <h3>{kindLabel(r.kind)}</h3>
            <div style={{ color: "#ccc", fontSize: 14, marginTop: 12 }}>
              {describeReward(r)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function kindLabel(k: string): string {
  switch (k) {
    case "heal": return "全力治療";
    case "addCard": return "加入新卡";
    case "buffMaxHp": return "強化體質";
    case "buffAtk": return "強化攻擊";
    default: return k;
  }
}
