import { useEffect, useMemo, useRef, useState } from "react";
import type { ModelInfo, WorkspaceConfig, WorkspaceMessage } from "../../types/app";

interface ChatPanelProps {
  workspace: WorkspaceConfig;
  messages: WorkspaceMessage[];
  selectedPath?: string;
  attachedPaths: string[];
  attachmentLimit: number;
  models: ModelInfo[];
  modelLoading: boolean;
  modelError?: string;
  apiKeyMissing: boolean;
  relatedContextCount: number;
  sending: boolean;
  attachmentError?: string;
  onSend: (prompt: string) => Promise<void>;
  onApply: (messageId: string) => Promise<void>;
  onUpdateWorkspace: (patch: Partial<WorkspaceConfig>) => void;
  onDetachReference: (path: string) => void;
}

function basename(path?: string): string {
  return path?.split("/").pop() ?? "";
}

export function ChatPanel(props: ChatPanelProps) {
  const {
    workspace,
    messages,
    selectedPath,
    attachedPaths,
    attachmentLimit,
    models,
    modelLoading,
    modelError,
    apiKeyMissing,
    relatedContextCount,
    sending,
    attachmentError,
    onSend,
    onApply,
    onUpdateWorkspace,
    onDetachReference,
  } = props;

  const [prompt, setPrompt] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [sendError, setSendError] = useState("");
  const [applyStateMap, setApplyStateMap] = useState<Record<string, string>>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, sending]);

  const modelOptions = useMemo(() => {
    if (workspace.model && !models.some((model) => model.id === workspace.model)) {
      return [
        {
          id: workspace.model,
          name: workspace.model,
          contextLength: 0,
          inputModalities: ["text"],
          outputModalities: ["text"],
          supportedParameters: [],
        },
        ...models,
      ];
    }
    return models;
  }, [models, workspace.model]);

  const currentModelLabel = models.find((model) => model.id === workspace.model)?.name ?? workspace.model;

  const submitPrompt = async () => {
    const nextPrompt = prompt.trim();
    if (!nextPrompt || sending || !selectedPath || apiKeyMissing) {
      return;
    }

    try {
      setSendError("");
      setPrompt("");
      await onSend(nextPrompt);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Failed to send prompt.");
      setPrompt(nextPrompt);
    }
  };

  return (
    <section className="chat-panel">
      <div className="chat-header">
        <div>
          <div className="chat-workspace-name">{workspace.name}</div>
          <div className="chat-target">{selectedPath ? `Target: ${basename(selectedPath)}` : "Choose a file to start."}</div>
        </div>
        <div className="chat-header-actions">
          <span className="status-pill">{currentModelLabel}</span>
          <button
            aria-label="Toggle workspace settings"
            className={`icon-button ${showSettings ? "is-active" : ""}`}
            onClick={() => setShowSettings((value) => !value)}
            type="button"
          >
            <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
              <circle cx="7" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.6 2.6l1.1 1.1M10.3 10.3l1.1 1.1M11.4 2.6l-1.1 1.1M3.7 10.3l-1.1 1.1"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.3"
              />
            </svg>
          </button>
        </div>
      </div>

      {showSettings ? (
        <div className="workspace-settings-panel">
          <div className="workspace-settings-grid">
            <label className="workspace-field">
              <span>Workspace name</span>
              <input className="text-input" onChange={(event) => onUpdateWorkspace({ name: event.target.value })} value={workspace.name} />
            </label>
            <label className="workspace-field">
              <span>Model</span>
              <select className="select-input" onChange={(event) => onUpdateWorkspace({ model: event.target.value })} value={workspace.model}>
                {modelOptions.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="workspace-field">
            <span>System prompt</span>
            <textarea
              className="text-area"
              onChange={(event) => onUpdateWorkspace({ systemPrompt: event.target.value })}
              rows={3}
              value={workspace.systemPrompt}
            />
          </label>

          <div className="workspace-settings-grid">
            <label className="workspace-field">
              <span>Temperature {workspace.temperature.toFixed(1)}</span>
              <input
                className="slider-input"
                max={2}
                min={0}
                onChange={(event) => onUpdateWorkspace({ temperature: Number(event.target.value) })}
                step={0.1}
                type="range"
                value={workspace.temperature}
              />
            </label>
            <label className="workspace-field">
              <span>Max completion tokens</span>
              <input
                className="text-input"
                min={256}
                onChange={(event) => onUpdateWorkspace({ maxCompletionTokens: Number(event.target.value) })}
                step={256}
                type="number"
                value={workspace.maxCompletionTokens}
              />
            </label>
          </div>

          <div className="workspace-field">
            <span>Reference files {attachedPaths.length}/{attachmentLimit}</span>
            <div className="chip-row compact-chip-row">
              {attachedPaths.length === 0 ? (
                <span className="inline-status">Pick reference files from the tree on the left.</span>
              ) : (
                attachedPaths.map((path) => (
                  <button className="chip-button" key={path} onClick={() => onDetachReference(path)} type="button">
                    {basename(path)} x
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="message-list" ref={listRef}>
        {messages.length === 0 && !sending ? (
          <div className="empty-chat">
            <p>Select a file, choose reference files if needed, and describe the rewrite you want.</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <article className={`message-card role-${message.role}`} key={message.id}>
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
                        {basename(path)}
                      </span>
                    ))}
                  </div>
                ) : null}
                {message.role === "assistant" && message.proposedContent ? (
                  <div className="proposal-row">
                    <button
                      className="solid-button"
                      onClick={async () => {
                        try {
                          setApplyStateMap((previous) => ({ ...previous, [message.id]: "Applying..." }));
                          await onApply(message.id);
                          setApplyStateMap((previous) => ({ ...previous, [message.id]: "Applied to the draft." }));
                        } catch (error) {
                          setApplyStateMap((previous) => ({
                            ...previous,
                            [message.id]: error instanceof Error ? error.message : "Failed to apply the draft.",
                          }));
                        }
                      }}
                      type="button"
                    >
                      Apply Draft
                    </button>
                    <span className="inline-status">{applyStateMap[message.id] ?? (message.targetPath ? `Target: ${basename(message.targetPath)}` : "")}</span>
                  </div>
                ) : null}
              </article>
            ))}
            {sending ? (
              <article className="message-card role-assistant is-pending">
                <div className="message-meta">
                  <span>AI</span>
                </div>
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </article>
            ) : null}
          </>
        )}
      </div>

      {apiKeyMissing ? <div className="panel-banner error">OpenRouter API key is missing.</div> : null}
      {modelError ? <div className="panel-banner error">{modelError}</div> : null}
      {attachmentError ? <div className="panel-banner error">{attachmentError}</div> : null}
      {sendError ? <div className="panel-banner error">{sendError}</div> : null}

      <div className="chat-input-wrap">
        <div className="chat-info-row">
          <span>{selectedPath ? selectedPath : "Choose a target file first."}</span>
          <span>
            References {attachedPaths.length}/{attachmentLimit}. Auto context {selectedPath ? relatedContextCount : 0}.
          </span>
        </div>
        <div className="prompt-row">
          <textarea
            className="prompt-textarea"
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void submitPrompt();
              }
            }}
            placeholder="Describe what to revise, what to preserve, and what the AI should use from the selected reference files."
            rows={3}
            value={prompt}
          />
          <button className="send-button" disabled={!prompt.trim() || sending || !selectedPath || apiKeyMissing} onClick={() => void submitPrompt()} type="button">
            Send
          </button>
        </div>
        <div className="inline-status">{modelLoading ? "Loading models..." : `${models.length} models available`}</div>
      </div>
    </section>
  );
}
