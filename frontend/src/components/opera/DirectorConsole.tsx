import { useState } from "react";
import type { ModelInfo } from "../../types/app";
import type { OperaCampaign, OperaGmConfig, OperaScene } from "../../types/opera";
import { GmPanel } from "./GmPanel";
import { LayerEditor } from "./LayerEditor";
import { ScenePicker } from "./ScenePicker";

interface DirectorConsoleProps {
  campaign: OperaCampaign;
  scenes: OperaScene[];
  models: ModelInfo[];
  isEvaluating: boolean;
  onSelectScene: (sceneId: string) => void;
  onAddScene: () => void;
  onUpdateScene: (sceneId: string, patch: Partial<OperaScene>) => void;
  onUpdateWorldKnowledge: (text: string) => void;
  onUpdateStoryState: (text: string) => void;
  onUpdateGmConfig: (patch: Partial<OperaGmConfig>) => void;
  onEvaluate: () => void;
}

export function DirectorConsole({
  campaign,
  scenes,
  models,
  isEvaluating,
  onSelectScene,
  onAddScene,
  onUpdateScene,
  onUpdateWorldKnowledge,
  onUpdateStoryState,
  onUpdateGmConfig,
  onEvaluate,
}: DirectorConsoleProps) {
  const [editingSceneDesc, setEditingSceneDesc] = useState(false);
  const activeScene = scenes.find((s) => s.id === campaign.activeSceneId);

  return (
    <div className="opera-panel">
      <div className="opera-panel-header">
        <span className="opera-panel-title">導演台</span>
      </div>

      <div className="opera-panel-scroll">
        <div className="opera-console-inner">

          {/* 場景選擇 */}
          <ScenePicker
            activeSceneId={campaign.activeSceneId}
            onAddScene={onAddScene}
            onSelectScene={onSelectScene}
            scenes={scenes}
          />

          {/* 目前場景說明 */}
          {activeScene && (
            <div className="opera-console-section">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="opera-console-section-title">場景設定</span>
                <button
                  className="ghost-button"
                  onClick={() => setEditingSceneDesc((v) => !v)}
                  style={{ fontSize: "0.76rem", padding: "2px 8px" }}
                  type="button"
                >
                  {editingSceneDesc ? "收起" : "編輯"}
                </button>
              </div>
              {editingSceneDesc ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    className="layer-editor-textarea"
                    onChange={(e) => onUpdateScene(activeScene.id, { title: e.target.value })}
                    placeholder="場景標題"
                    rows={1}
                    style={{ minHeight: 34, height: 34 }}
                    value={activeScene.title}
                  />
                  <textarea
                    className="layer-editor-textarea"
                    onChange={(e) => onUpdateScene(activeScene.id, { description: e.target.value })}
                    placeholder="場景說明：地點、時間、氛圍、導演的背景設定…"
                    rows={4}
                    value={activeScene.description}
                  />
                </div>
              ) : (
                activeScene.description ? (
                  <p style={{ fontSize: "0.84rem", color: "var(--muted)", lineHeight: 1.55 }}>
                    {activeScene.description}
                  </p>
                ) : (
                  <p style={{ fontSize: "0.82rem", color: "var(--muted)", fontStyle: "italic" }}>
                    尚未設定場景說明
                  </p>
                )
              )}
            </div>
          )}

          {/* L1：世界知識 */}
          <div className="opera-console-section">
            <span className="opera-console-section-title">世界知識（L1）</span>
            <LayerEditor
              badge="全員可見"
              hint="所有角色共用的世界背景與公開事實。"
              label=""
              onChange={onUpdateWorldKnowledge}
              placeholder="世界規則、公開歷史、地理設定…"
              rows={4}
              value={campaign.worldKnowledge}
            />
          </div>

          {/* L2：故事狀態 */}
          <div className="opera-console-section">
            <span className="opera-console-section-title">故事狀態（L2）</span>
            <LayerEditor
              badge="公開事件"
              hint="目前公開的故事進展。各角色個別的視角可在角色設定中的 L2 欄位補充。"
              label=""
              onChange={onUpdateStoryState}
              placeholder="最新章節摘要、已知的事件時間線…"
              rows={4}
              value={campaign.storyState}
            />
          </div>

          {/* GM 面板 */}
          <GmPanel
            gmConfig={campaign.gmConfig}
            isEvaluating={isEvaluating}
            models={models}
            onEvaluate={onEvaluate}
            onUpdate={onUpdateGmConfig}
          />

        </div>
      </div>
    </div>
  );
}
