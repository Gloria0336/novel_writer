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
  relatedContextCount: number;
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
  onApplyProposedDraft: (workspaceId: string, messageId: string) => Promise<void>;
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
    relatedContextCount,
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
    onApplyProposedDraft,
  } = props;

  const [promptMap, setPromptMap] = useState<Record<string, string>>({});
  const [attachInputMap, setAttachInputMap] = useState<Record<string, string>>({});
  const [modelSearchMap, setModelSearchMap] = useState<Record<string, string>>({});
  const [sendErrorMap, setSendErrorMap] = useState<Record<string, string>>({});
  const [applyStateMap, setApplyStateMap] = useState<Record<string, string>>({});
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
        name: `${workspace.model} (saved)`,
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
          <div className="eyebrow">AI Revision</div>
          <h3>{workspace.name}</h3>
          <div className="inline-status">Target file: {selectedPath ?? "Select a file from the sidebar"}</div>
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
            Clear Chat
          </button>
          <button className="solid-button" onClick={onAddWorkspace} type="button">
            New Workspace
          </button>
        </div>
      </div>

      <section className="workspace-chat">
        <div className="message-list">
          {currentMessages.length === 0 ? (
            <div className="panel-empty">Choose a target file, describe the revision, and the assistant will propose a full-file draft.</div>
          ) : (
            currentMessages.map((message) => (
              <article className={`message-bubble role-${message.role}`} key={message.id}>
                <div className="message-meta">
                  <span>{message.role === "user" ? "You" : "AI"}</span>
                  <span>
                    {new Date(message.createdAt).toLocaleTimeString("zh-TW", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <pre>{message.content}</pre>
                {message.sourceFilePaths.length > 0 ? (
                  <div className="chip-row">
                    {message.sourceFilePaths.map((path) => (
                      <span className="chip-button" key={`${message.id}-${path}`}>
                        {path}
                      </span>
                    ))}
                  </div>
                ) : null}
                {message.role === "assistant" && message.proposedContent && message.targetPath ? (
                  <div className="inline-row">
                    <button
                      className="solid-button"
                      onClick={async () => {
                        const key = `${workspace.id}:${message.id}`;
                        try {
                          setApplyStateMap((previous) => ({ ...previous, [key]: "Applying..." }));
                          await onApplyProposedDraft(workspace.id, message.id);
                          setApplyStateMap((previous) => ({ ...previous, [key]: "Applied to draft." }));
                        } catch (error) {
                          setApplyStateMap((previous) => ({
                            ...previous,
                            [key]: error instanceof Error ? error.message : "Failed to apply draft.",
                          }));
                        }
                      }}
                      type="button"
                    >
                      Apply To Draft
                    </button>
                    <span className="inline-status">{applyStateMap[`${workspace.id}:${message.id}`] ?? `Target: ${message.targetPath}`}</span>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>

        {sendErrorMap[workspace.id] ? <div className="panel-banner error">{sendErrorMap[workspace.id]}</div> : null}
        {!selectedPath ? <div className="panel-banner muted">Select the file you want the AI to rewrite before sending a prompt.</div> : null}
        {selectedModelMissing ? <div className="panel-banner muted">The saved model is not in the current bridge model list.</div> : null}
        {modelError ? <div className="panel-banner error">{modelError}</div> : null}

        <label>
          Revision prompt
          <textarea
            aria-label="Revision prompt"
            className="text-area prompt-area"
            onChange={(event) =>
              setPromptMap((previous) => ({
                ...previous,
                [workspace.id]: event.target.value,
              }))
            }
            placeholder="Example: tighten chapter pacing, preserve canon, and return the full updated markdown file."
            rows={4}
            value={promptMap[workspace.id] ?? ""}
          />
        </label>
        <div className="inline-row prompt-actions">
          <button
            className="solid-button"
            disabled={sendingWorkspaceId === workspace.id || !selectedPath || !(promptMap[workspace.id] ?? "").trim()}
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
                  [workspace.id]: error instanceof Error ? error.message : "Failed to send prompt.",
                }));
              }
            }}
            type="button"
          >
            {sendingWorkspaceId === workspace.id ? "Sending..." : "Send Prompt"}
          </button>
          <span className="inline-status">
            Attached files: {workspace.attachedPaths.length}. Related canon files: {relatedContextCount}.
          </span>
        </div>
      </section>

      <details className="workspace-advanced">
        <summary>Workspace Settings</summary>
        <section className="workspace-settings">
          <label>
            Workspace name
            <input
              aria-label="Workspace name"
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
              placeholder="Filter by model id or name"
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
              {favoriteModels.includes(workspace.model) ? "Unfavorite Model" : "Favorite Model"}
            </button>
            <span className="inline-status">{modelLoading ? "Loading models..." : `${models.length} text models`}</span>
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
            System prompt
            <textarea
              aria-label="System prompt"
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
            <label>
              Auto context status
              <input className="text-input" disabled type="text" value={`${relatedContextCount} related files`} />
            </label>
          </div>

          <label className="checkbox-row">
            <input
              checked={workspace.autoAttachActiveFile}
              onChange={(event) => onUpdateWorkspace(workspace.id, { autoAttachActiveFile: event.target.checked })}
              type="checkbox"
            />
            Auto-attach selected file
          </label>

          <label className="checkbox-row">
            <input
              checked={workspace.autoAttachRelatedFiles}
              onChange={(event) => onUpdateWorkspace(workspace.id, { autoAttachRelatedFiles: event.target.checked })}
              type="checkbox"
            />
            Auto-attach related canon files
          </label>

          <div className="panel-header">
            <h4>Attached Files</h4>
            {selectedPath ? (
              <button className="ghost-button" onClick={() => onAttachPath(workspace.id, selectedPath)} type="button">
                Attach Selected File
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
              placeholder="Pick an extra context path"
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
              <span className="inline-status">No extra context files attached.</span>
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
              Remove Workspace
            </button>
          ) : null}
        </section>
      </details>
    </div>
  );
}
