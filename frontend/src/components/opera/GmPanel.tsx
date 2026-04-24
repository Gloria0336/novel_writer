import type { ModelInfo } from "../../types/app";
import type { OperaGmConfig } from "../../types/opera";

interface GmPanelProps {
  gmConfig: OperaGmConfig;
  models: ModelInfo[];
  onUpdate: (patch: Partial<OperaGmConfig>) => void;
  onEvaluate: () => void;
  isEvaluating: boolean;
}

export function GmPanel({ gmConfig, models, onUpdate, onEvaluate, isEvaluating }: GmPanelProps) {
  return (
    <div className="opera-gm-panel">
      <div className="opera-gm-header">
        <span className="opera-gm-title">⚖ 故事管理引擎（GM）</span>
        <label className="toggle-label" style={{ fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6 }}>
          <input
            checked={gmConfig.isEnabled}
            onChange={(e) => onUpdate({ isEnabled: e.target.checked })}
            type="checkbox"
          />
          啟用
        </label>
      </div>

      {gmConfig.isEnabled && (
        <div className="opera-gm-fields">
          <div className="opera-gm-field">
            <label className="opera-gm-field-label">AI 模型</label>
            <select
              onChange={(e) => onUpdate({ model: e.target.value })}
              value={gmConfig.model}
            >
              {models.length === 0 && (
                <option value={gmConfig.model}>{gmConfig.model}</option>
              )}
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="opera-gm-field">
            <label className="opera-gm-field-label">溫度（創意度）</label>
            <input
              max="1"
              min="0"
              onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) || 0.4 })}
              step="0.05"
              type="number"
              value={gmConfig.temperature}
            />
          </div>

          <div className="opera-gm-field">
            <label className="opera-gm-field-label">額外指示（可選）</label>
            <textarea
              className="layer-editor-textarea"
              onChange={(e) => onUpdate({ systemPromptExtra: e.target.value })}
              placeholder="例如：重點關注角色動機是否合理..."
              rows={2}
              value={gmConfig.systemPromptExtra}
            />
          </div>

          <button
            className="ghost-button"
            disabled={isEvaluating}
            onClick={onEvaluate}
            style={{ marginTop: 2 }}
            type="button"
          >
            {isEvaluating ? "評估中..." : "⚖ 立即評估場景"}
          </button>
        </div>
      )}
    </div>
  );
}
