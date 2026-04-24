import type { OperaScene } from "../../types/opera";

interface ScenePickerProps {
  scenes: OperaScene[];
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onAddScene: () => void;
}

export function ScenePicker({ scenes, activeSceneId, onSelectScene, onAddScene }: ScenePickerProps) {
  return (
    <div className="opera-console-section">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span className="opera-console-section-title">場景</span>
        <button
          className="ghost-button"
          onClick={onAddScene}
          style={{ fontSize: "0.78rem", padding: "3px 10px" }}
          title="新增場景"
          type="button"
        >
          + 新場景
        </button>
      </div>

      <div className="opera-scene-list">
        {scenes.map((scene) => (
          <button
            className={`opera-scene-item${scene.id === activeSceneId ? " is-active" : ""}`}
            key={scene.id}
            onClick={() => onSelectScene(scene.id)}
            type="button"
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {scene.title || "（無標題場景）"}
            </span>
            {scene.id === activeSceneId && (
              <span style={{ fontSize: "0.74rem", color: "var(--accent)", flexShrink: 0 }}>
                ▶ 進行中
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
