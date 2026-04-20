import { useEffect, useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  openRouterApiKey?: string;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

export function SettingsModal(props: SettingsModalProps) {
  const { isOpen, openRouterApiKey, onClose, onSave } = props;
  const [apiKey, setApiKey] = useState(openRouterApiKey ?? "");

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setApiKey(openRouterApiKey ?? "");
  }, [isOpen, openRouterApiKey]);

  if (!isOpen) {
    return null;
  }

  const hasKey = apiKey.trim().length > 0;

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div className="modal-card modal-card-compact" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <div className="eyebrow">總設定</div>
            <h2>API 設定</h2>
          </div>
          <button aria-label="關閉" className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className={`settings-state ${hasKey ? "is-ready" : "is-muted"}`}>
          {hasKey ? "✓ 已設定 OpenRouter API 金鑰" : "尚未設定 API 金鑰"}
        </div>

        <label className="modal-field">
          <span>OpenRouter API 金鑰</span>
          <input
            className="text-input"
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-or-v1-..."
            type="password"
            value={apiKey}
          />
          <small className="field-hint">
            金鑰只會儲存在這個瀏覽器。你可以到 <strong>openrouter.ai</strong> 建立或管理金鑰。
          </small>
        </label>

        <div className="modal-footer">
          <button className="ghost-button" onClick={onClose} type="button">
            取消
          </button>
          <button
            className="solid-button"
            onClick={() => {
              onSave(apiKey.trim());
              onClose();
            }}
            type="button"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
}
