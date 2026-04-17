import { useMemo, useState } from "react";
import type { ModelInfo, WorkspaceConfig, WorkspaceMessage } from "../../types/app";

interface WorkspaceDockProps {
  workspaces: WorkspaceConfig[];
  activeWorkspaceId: string;
  messages: Record<string, WorkspaceMessage[]>;
  availablePaths: string[];
  selectedPath?: string;
  models: ModelInfo[];
  modelLoading: boolean;
  modelError?: string;
  favoriteModels: string[];
  recentModels: string[];
  sendingWorkspaceId?: string;
  onSelectWorkspace: (workspaceId: string) => void;
  onAddWorkspace: () => void;
  onRemoveWorkspace: (workspaceId: string) => void;
  onUpdateWorkspace: (workspaceId: string, patch: Partial<WorkspaceConfig>) => void;
  onSendPrompt: (workspaceId: string, prompt: string) => Promise<void>;
  onAttachPath: (workspaceId: string, path: string) => void;
  onDetachPath: (workspaceId: string, path: string) => void;
  onClearMessages: (workspaceId: string) => void;
  onToggleFavoriteModel: (modelId: string) => void;
  onInsertToEditor: (content: string) => void;
  onReplaceSelection: (content: string) => void;
  onReplaceEditor: (content: string) => void;
}

export function WorkspaceDock(props: WorkspaceDockProps) {
  const {
    workspaces,
    activeWorkspaceId,
    messages,
    availablePaths,
    selectedPath,
    models,
    modelLoading,
    modelError,
    favoriteModels,
    recentModels,
    sendingWorkspaceId,
    onSelectWorkspace,
    onAddWorkspace,
    onRemoveWorkspace,
    onUpdateWorkspace,
    onSendPrompt,
    onAttachPath,
    onDetachPath,
    onClearMessages,
    onToggleFavoriteModel,
    onInsertToEditor,
    onReplaceSelection,
    onReplaceEditor,
  } = props;

  const [promptMap, setPromptMap] = useState<Record<string, string>>({});
  const [attachInputMap, setAttachInputMap] = useState<Record<string, string>>({});
  const [modelSearchMap, setModelSearchMap] = useState<Record<string, string>>({});
  const [sendErrorMap, setSendErrorMap] = useState<Record<string, string>>({});
  const workspace = workspaces.find((item) => item.id === activeWorkspaceId) ?? workspaces[0];
  const currentMessages = messages[workspace.id] ?? [];
  const modelSearch = modelSearchMap[workspace.id] ?? "";
  const filteredModels = useMemo(() => {
    const keyword = modelSearch.trim().toLowerCase();
    if (!keyword) {
      return models;
    }
    return models.filter((model) => model.id.toLowerCase().includes(keyword) || model.name.toLowerCase().includes(keyword));
  }, [modelSearch, models]);
  const selectedModelMissing = workspace.model.trim().length > 0 && !models.some((model) => model.id === workspace.model);
  const modelOptions = useMemo(() => {
    const filteredIds = new Set(filteredModels.map((model) => model.id));
    if (workspace.model && !filteredIds.has(workspace.model)) {
      const fallbackModel: ModelInfo = {
        id: workspace.model,
        name: `${workspace.model}（目前使用）`,
        contextLength: 0,
        inputModalities: ["text"],
        outputModalities: ["text"],
        supportedParameters: [],
      };
      return [fallbackModel, ...filteredModels];
    }
    return filteredModels;
  }, [filteredModels, workspace.model]);

  return (
    <div className="workspace-dock">
      <div className="workspace-dock-bar">
        <div>
          <div className="eyebrow">AI</div>
          <h3>{workspace.name}</h3>
        </div>
        <div className="inline-row">
          <div className="workspace-tab-strip">
            {workspaces.map((item) => (
              <button
                key={item.id}
                className={`workspace-tab ${item.id === workspace.id ? "is-active" : ""}`}
                onClick={() => onSelectWorkspace(item.id)}
                type="button"
              >
                {item.name}
              </button>
            ))}
          </div>
          <button className="ghost-button" onClick={() => onClearMessages(workspace.id)} type="button">
            清除對話
          </button>
          <button className="solid-button" onClick={onAddWorkspace} type="button">
            新增對話
          </button>
        </div>
      </div>

      <section className="workspace-chat">
        <div className="message-list">
          {currentMessages.length === 0 ? (
            <div className="panel-empty">這裡會顯示你和 AI 的對話。輸入需求後就能開始。</div>
          ) : (
            currentMessages.map((message) => (
              <article className={`message-bubble role-${message.role}`} key={message.id}>
                <div className="message-meta">
                  <span>{message.role === "user" ? "你" : "AI"}</span>
                  <span>
                    {new Date(message.createdAt).toLocaleTimeString("zh-TW", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <pre>{message.content}</pre>
                {message.role === "assistant" ? (
                  <div className="inline-row">
                    <button className="ghost-button" onClick={() => onInsertToEditor(message.content)} type="button">
                      插入游標處
                    </button>
                    <button className="ghost-button" onClick={() => onReplaceSelection(message.content)} type="button">
                      取代選取內容
                    </button>
                    <button className="ghost-button" onClick={() => onReplaceEditor(message.content)} type="button">
                      覆蓋整份文檔
                    </button>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>

        {sendErrorMap[workspace.id] ? <div className="panel-banner error">{sendErrorMap[workspace.id]}</div> : null}
        {selectedModelMissing ? <div className="panel-banner muted">目前選擇的模型不在最新清單中，但仍可直接送出請求。</div> : null}
        {modelError ? <div className="panel-banner error">{modelError}</div> : null}

        <label>
          輸入需求
          <textarea
            className="text-area prompt-area"
            onChange={(event) =>
              setPromptMap((previous) => ({
                ...previous,
                [workspace.id]: event.target.value,
              }))
            }
            placeholder="例如：請幫我潤飾這段對白、延伸角色設定，或檢查前後設定是否衝突。"
            rows={4}
            value={promptMap[workspace.id] ?? ""}
          />
        </label>
        <div className="inline-row prompt-actions">
          <button
            className="solid-button"
            disabled={sendingWorkspaceId === workspace.id || !(promptMap[workspace.id] ?? "").trim()}
            onClick={async () => {
              const prompt = (promptMap[workspace.id] ?? "").trim();
              if (!prompt) {
                return;
              }
              try {
                setSendErrorMap((previous) => ({ ...previous, [workspace.id]: "" }));
                await onSendPrompt(workspace.id, prompt);
                setPromptMap((previous) => ({
                  ...previous,
                  [workspace.id]: "",
                }));
              } catch (error) {
                setSendErrorMap((previous) => ({
                  ...previous,
                  [workspace.id]: error instanceof Error ? error.message : "送出需求失敗。",
                }));
              }
            }}
            type="button"
          >
            {sendingWorkspaceId === workspace.id ? "送出中..." : "送出"}
          </button>
          <span className="inline-status">
            已附加檔案 {workspace.attachedPaths.length} 個
            {workspace.autoAttachActiveFile && selectedPath ? "，並自動帶入目前文檔" : ""}
          </span>
        </div>
      </section>

      <details className="workspace-advanced">
        <summary>進階設定</summary>
        <section className="workspace-settings">
          <label>
            對話名稱
            <input
              className="text-input"
              onChange={(event) => onUpdateWorkspace(workspace.id, { name: event.target.value })}
              type="text"
              value={workspace.name}
            />
          </label>

          <label>
            搜尋模型
            <input
              className="text-input"
              onChange={(event) =>
                setModelSearchMap((previous) => ({
                  ...previous,
                  [workspace.id]: event.target.value,
                }))
              }
              placeholder="輸入模型名稱或 ID"
              type="text"
              value={modelSearch}
            />
          </label>

          <label>
            模型
            <select
              className="select-input"
              onChange={(event) => onUpdateWorkspace(workspace.id, { model: event.target.value })}
              value={workspace.model}
            >
              {modelOptions.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id}
                </option>
              ))}
            </select>
          </label>

          <div className="inline-row">
            <button className="ghost-button" onClick={() => onToggleFavoriteModel(workspace.model)} type="button">
              {favoriteModels.includes(workspace.model) ? "移除常用模型" : "加入常用模型"}
            </button>
            <span className="inline-status">{modelLoading ? "模型載入中..." : `可用文字模型 ${models.length} 個`}</span>
          </div>

          <div className="chip-row">
            {favoriteModels.concat(recentModels.filter((item) => !favoriteModels.includes(item))).slice(0, 8).map((modelId) => (
              <button
                className={`chip-button ${workspace.model === modelId ? "is-active" : ""}`}
                key={modelId}
                onClick={() => onUpdateWorkspace(workspace.id, { model: modelId })}
                type="button"
              >
                {modelId}
              </button>
            ))}
          </div>

          <label>
            系統提示
            <textarea
              className="text-area"
              onChange={(event) => onUpdateWorkspace(workspace.id, { systemPrompt: event.target.value })}
              rows={5}
              value={workspace.systemPrompt}
            />
          </label>

          <div className="settings-grid">
            <label>
              Temperature
              <input
                className="text-input"
                max={2}
                min={0}
                onChange={(event) => onUpdateWorkspace(workspace.id, { temperature: Number(event.target.value) })}
                step={0.1}
                type="number"
                value={workspace.temperature}
              />
            </label>
            <label>
              最大回覆 Token
              <input
                className="text-input"
                min={64}
                onChange={(event) => onUpdateWorkspace(workspace.id, { maxCompletionTokens: Number(event.target.value) })}
                step={64}
                type="number"
                value={workspace.maxCompletionTokens}
              />
            </label>
          </div>

          <label className="checkbox-row">
            <input
              checked={workspace.autoAttachActiveFile}
              onChange={(event) => onUpdateWorkspace(workspace.id, { autoAttachActiveFile: event.target.checked })}
              type="checkbox"
            />
            自動附加目前文檔
          </label>

          <div className="panel-header">
            <h4>附加檔案</h4>
            {selectedPath ? (
              <button className="ghost-button" onClick={() => onAttachPath(workspace.id, selectedPath)} type="button">
                附加目前文檔
              </button>
            ) : null}
          </div>

          <div className="inline-row">
            <input
              className="text-input"
              list={`paths-${workspace.id}`}
              onChange={(event) =>
                setAttachInputMap((previous) => ({
                  ...previous,
                  [workspace.id]: event.target.value,
                }))
              }
              placeholder="輸入或選擇檔案路徑"
              type="text"
              value={attachInputMap[workspace.id] ?? ""}
            />
            <datalist id={`paths-${workspace.id}`}>
              {availablePaths.map((path) => (
                <option key={path} value={path} />
              ))}
            </datalist>
            <button
              className="ghost-button"
              onClick={() => {
                const path = attachInputMap[workspace.id]?.trim();
                if (path) {
                  onAttachPath(workspace.id, path);
                  setAttachInputMap((previous) => ({ ...previous, [workspace.id]: "" }));
                }
              }}
              type="button"
            >
              附加
            </button>
          </div>

          <div className="chip-row">
            {workspace.attachedPaths.length === 0 ? (
              <span className="inline-status">尚未手動附加檔案。</span>
            ) : (
              workspace.attachedPaths.map((path) => (
                <button className="chip-button" key={path} onClick={() => onDetachPath(workspace.id, path)} type="button">
                  {path} ×
                </button>
              ))
            )}
          </div>

          {workspaces.length > 1 ? (
            <button className="danger-button" onClick={() => onRemoveWorkspace(workspace.id)} type="button">
              刪除此對話
            </button>
          ) : null}
        </section>
      </details>
    </div>
  );
}
