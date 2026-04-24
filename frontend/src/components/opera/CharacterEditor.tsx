import { useState } from "react";
import type { ModelInfo } from "../../types/app";
import type { OperaCharacter } from "../../types/opera";
import { LayerEditor } from "./LayerEditor";

interface CharacterEditorProps {
  character: OperaCharacter;
  models: ModelInfo[];
  onSave: (patch: Partial<OperaCharacter>) => void;
  onClose: () => void;
}

type Tab = "identity" | "layers";

export function CharacterEditor({ character, models, onSave, onClose }: CharacterEditorProps) {
  const [tab, setTab] = useState<Tab>("identity");
  const [draft, setDraft] = useState<OperaCharacter>({ ...character });

  const set = (patch: Partial<OperaCharacter>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const setLayer = (key: keyof OperaCharacter["memoryLayers"], value: string) =>
    setDraft((prev) => ({
      ...prev,
      memoryLayers: { ...prev.memoryLayers, [key]: value },
    }));

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog">
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">編輯角色：{character.name}</h2>
          <button aria-label="關閉" className="icon-button" onClick={onClose} type="button">
            <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
            </svg>
          </button>
        </div>

        {/* 分頁切換 */}
        <div style={{ display: "flex", gap: 0, padding: "0 24px", borderBottom: "1px solid var(--border)" }}>
          {(["identity", "layers"] as Tab[]).map((t) => (
            <button
              className={`topbar-view-button${tab === t ? " is-active" : ""}`}
              key={t}
              onClick={() => setTab(t)}
              style={{ borderRadius: 0, borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent" }}
              type="button"
            >
              {t === "identity" ? "身份設定" : "記憶層"}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {tab === "identity" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="opera-gm-field-label">角色名稱</label>
                  <input
                    className="layer-editor-textarea"
                    onChange={(e) => set({ name: e.target.value })}
                    rows={1}
                    style={{ height: 36, minHeight: 36 }}
                    value={draft.name}
                  />
                </div>
                <div>
                  <label className="opera-gm-field-label">職位 / 身分標籤</label>
                  <input
                    className="layer-editor-textarea"
                    onChange={(e) => set({ role: e.target.value })}
                    placeholder="主角、反派、謎樣角色…"
                    rows={1}
                    style={{ height: 36, minHeight: 36 }}
                    value={draft.role}
                  />
                </div>
              </div>

              <div>
                <label className="opera-gm-field-label">AI 模型</label>
                <select
                  className="opera-type-select"
                  onChange={(e) => set({ model: e.target.value })}
                  style={{ width: "100%", marginTop: 4 }}
                  value={draft.model}
                >
                  {models.length === 0 && <option value={draft.model}>{draft.model}</option>}
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="opera-gm-field-label">溫度（創意度）</label>
                  <input
                    className="layer-editor-textarea"
                    max="1"
                    min="0"
                    onChange={(e) => set({ temperature: parseFloat(e.target.value) || 0.85 })}
                    rows={1}
                    step="0.05"
                    style={{ height: 36, minHeight: 36 }}
                    type="number"
                    value={draft.temperature}
                  />
                </div>
                <div>
                  <label className="opera-gm-field-label">最大 Token 數</label>
                  <input
                    className="layer-editor-textarea"
                    min="100"
                    onChange={(e) => set({ maxCompletionTokens: parseInt(e.target.value, 10) || 600 })}
                    rows={1}
                    step="100"
                    style={{ height: 36, minHeight: 36 }}
                    type="number"
                    value={draft.maxCompletionTokens}
                  />
                </div>
              </div>

              <LayerEditor
                hint="描述角色的性格特質、行為模式、價值觀等。"
                label="個性描述"
                onChange={(v) => set({ personality: v })}
                placeholder="例如：理性吐槽型、韌性強、遇事先慌後撐、本質善良…"
                rows={4}
                value={draft.personality}
              />

              <LayerEditor
                hint="描述角色通常的說話方式、用詞習慣、語氣特色。"
                label="說話方式"
                onChange={(v) => set({ speechStyle: v })}
                placeholder="例如：嘴硬碎念多，緊張時容易高速吐槽；說話風格偏向…"
                rows={3}
                value={draft.speechStyle}
              />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <LayerEditor
                badge="L1 — 全員可見"
                hint="關於世界運作的公開知識，此角色所知的背景資訊。（補充劇本層級的 L1）"
                label="世界知識"
                onChange={(v) => setLayer("worldKnowledge", v)}
                placeholder="此角色特有的世界知識補充…"
                rows={3}
                value={draft.memoryLayers.worldKnowledge}
              />
              <LayerEditor
                badge="L2 — 角色視角"
                hint="此角色目前對故事狀態的認知。（補充劇本層級的 L2，可填入此角色不知道的資訊留白）"
                label="故事狀態（此角色的視角）"
                onChange={(v) => setLayer("storyState", v)}
                placeholder="此角色所知的最新事件、線索…"
                rows={3}
                value={draft.memoryLayers.storyState}
              />
              <LayerEditor
                badge="L3 — 僅此角色"
                hint="此角色的個人記憶、過去經歷、私人目標。AI 扮演此角色時可見。"
                label="個人記憶"
                onChange={(v) => setLayer("characterMemory", v)}
                placeholder="此角色的目標、秘密、過去事件…"
                rows={4}
                value={draft.memoryLayers.characterMemory}
              />
              <LayerEditor
                badge="L4 — 僅導演可見"
                hint="此角色的隱藏動機與秘密意圖。絕不傳送給任何 AI，僅供導演掌握全局。"
                label="隱藏意圖"
                locked
                onChange={(v) => setLayer("hiddenIntent", v)}
                placeholder="此角色背地裡真正的目的、隱藏的計劃…"
                rows={4}
                value={draft.memoryLayers.hiddenIntent}
              />
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button className="ghost-button" onClick={onClose} type="button">取消</button>
          <button className="solid-button" onClick={handleSave} type="button">儲存變更</button>
        </div>
      </div>
    </div>
  );
}
