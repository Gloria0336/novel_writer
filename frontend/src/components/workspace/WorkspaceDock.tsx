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
        name: `${workspace.model} (current)`,
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
      <div className="workspace-tabs">
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
        <button className="solid-button" onClick={onAddWorkspace} type="button">
          New Workspace
        </button>
      </div>

      <div className="workspace-grid">
        <section className="workspace-settings">
          <div className="panel-header">
            <div>
              <div className="eyebrow">Workspace</div>
              <h3>Agent config</h3>
            </div>
            {workspaces.length > 1 ? (
              <button className="ghost-button" onClick={() => onRemoveWorkspace(workspace.id)} type="button">
                Remove
              </button>
            ) : null}
          </div>

          <label>
            Workspace name
            <input
              className="text-input"
              onChange={(event) => onUpdateWorkspace(workspace.id, { name: event.target.value })}
              type="text"
              value={workspace.name}
            />
          </label>
          <label>
            Search models
            <input
              className="text-input"
              onChange={(event) =>
                setModelSearchMap((previous) => ({
                  ...previous,
                  [workspace.id]: event.target.value,
                }))
              }
              placeholder="Search OpenRouter models..."
              type="text"
              value={modelSearch}
            />
          </label>
          <label>
            Model
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
              {favoriteModels.includes(workspace.model) ? "Unfavorite model" : "Favorite model"}
            </button>
            <span className="inline-status">{modelLoading ? "Loading models..." : `${models.length} text models`}</span>
          </div>
          {selectedModelMissing ? <div className="panel-banner muted">目前選定模型不在最新模型清單中，仍可手動保留後續再測試。</div> : null}
          {modelError ? <div className="panel-banner error">{modelError}</div> : null}

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
            System prompt
            <textarea
              className="text-area"
              onChange={(event) => onUpdateWorkspace(workspace.id, { systemPrompt: event.target.value })}
              rows={6}
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
              Max completion tokens
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
            Auto-attach active file
          </label>

          <div className="panel-header">
            <h4>Attached files</h4>
            {selectedPath ? (
              <button className="ghost-button" onClick={() => onAttachPath(workspace.id, selectedPath)} type="button">
                Attach current file
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
              placeholder="Add file path..."
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
              Attach
            </button>
          </div>
          <div className="chip-row">
            {workspace.attachedPaths.length === 0 ? (
              <span className="inline-status">No manual attachments yet.</span>
            ) : (
              workspace.attachedPaths.map((path) => (
                <button className="chip-button" key={path} onClick={() => onDetachPath(workspace.id, path)} type="button">
                  {path} ×
                </button>
              ))
            )}
          </div>
        </section>

        <section className="workspace-chat">
          <div className="panel-header">
            <div>
              <div className="eyebrow">AI Dock</div>
              <h3>Conversation</h3>
            </div>
            <button className="ghost-button" onClick={() => onClearMessages(workspace.id)} type="button">
              Clear chat
            </button>
          </div>
          <div className="message-list">
            {currentMessages.length === 0 ? (
              <div className="panel-empty">這個 workspace 還沒有對話。輸入 prompt 後會帶入系統提示與附加檔案。</div>
            ) : (
              currentMessages.map((message) => (
                <article className={`message-bubble role-${message.role}`} key={message.id}>
                  <div className="message-meta">
                    <span>{message.role}</span>
                    <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <pre>{message.content}</pre>
                  {message.role === "assistant" ? (
                    <div className="inline-row">
                      <button className="ghost-button" onClick={() => onInsertToEditor(message.content)} type="button">
                        Insert at cursor
                      </button>
                      <button className="ghost-button" onClick={() => onReplaceSelection(message.content)} type="button">
                        Replace selection
                      </button>
                      <button className="ghost-button" onClick={() => onReplaceEditor(message.content)} type="button">
                        Replace editor
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
          {sendErrorMap[workspace.id] ? <div className="panel-banner error">{sendErrorMap[workspace.id]}</div> : null}
          <label>
            Prompt
            <textarea
              className="text-area prompt-area"
              onChange={(event) =>
                setPromptMap((previous) => ({
                  ...previous,
                  [workspace.id]: event.target.value,
                }))
              }
              placeholder="Ask for a rewrite, idea expansion, consistency check, or outline pass..."
              rows={4}
              value={promptMap[workspace.id] ?? ""}
            />
          </label>
          <div className="inline-row">
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
                    [workspace.id]: error instanceof Error ? error.message : "Prompt failed.",
                  }));
                }
              }}
              type="button"
            >
              {sendingWorkspaceId === workspace.id ? "Sending..." : "Send prompt"}
            </button>
            <span className="inline-status">
              Context: {workspace.attachedPaths.length} manual + {workspace.autoAttachActiveFile && selectedPath ? "active file" : "no active file"}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
