import { useEffect, useMemo, useState } from "react";
import type { AppSettings, BridgeStatus } from "../../types/app";
import { DEFAULT_REPO_CONFIG } from "../../utils/constants";

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  bridgeStatus?: BridgeStatus | null;
  onClose: () => void;
  onSave: (nextSettings: AppSettings) => void;
  onClearSecrets: () => void;
  onCheckBridge: () => Promise<string>;
}

export function SettingsModal(props: SettingsModalProps) {
  const { isOpen, settings, bridgeStatus, onClose, onSave, onClearSecrets, onCheckBridge } = props;
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [overrideRepo, setOverrideRepo] = useState(Boolean(settings.repoOverride));
  const [bridgeCheckStatus, setBridgeCheckStatus] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setLocalSettings(settings);
    setOverrideRepo(Boolean(settings.repoOverride));
    setBridgeCheckStatus("");
  }, [isOpen, settings]);

  const repoFields = useMemo(
    () =>
      localSettings.repoOverride ?? {
        owner: DEFAULT_REPO_CONFIG.owner,
        repo: DEFAULT_REPO_CONFIG.repo,
        branch: DEFAULT_REPO_CONFIG.branch,
      },
    [localSettings.repoOverride],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">Settings</div>
            <h2>Workspace Configuration</h2>
          </div>
          <button className="ghost-button" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="settings-warning">
          The browser no longer stores GitHub or OpenRouter secrets. Run the local bridge with environment variables instead.
        </div>

        <section className="settings-section">
          <h3>Bridge</h3>
          <div className="inline-row">
            <button
              className="ghost-button"
              type="button"
              onClick={async () => {
                setBridgeCheckStatus("Checking bridge...");
                setBridgeCheckStatus(await onCheckBridge());
              }}
            >
              Check Bridge
            </button>
            <span className="inline-status">{bridgeCheckStatus}</span>
          </div>
          {bridgeStatus ? (
            <div className="panel-banner muted">
              Repo adapter: {bridgeStatus.repoAdapter}. GitHub token: {bridgeStatus.hasGitHubToken ? "configured" : "missing"}. OpenRouter key:{" "}
              {bridgeStatus.hasOpenRouterApiKey ? "configured" : "missing"}.
            </div>
          ) : null}
          <button className="danger-button" onClick={onClearSecrets} type="button">
            Clear legacy browser state
          </button>
        </section>

        <section className="settings-section">
          <div className="inline-row">
            <h3>Repository Target</h3>
            <label className="checkbox-row">
              <input checked={overrideRepo} onChange={(event) => setOverrideRepo(event.target.checked)} type="checkbox" />
              Override default repo
            </label>
          </div>
          <div className="settings-grid">
            <label>
              Owner
              <input
                className="text-input"
                type="text"
                value={repoFields.owner}
                disabled={!overrideRepo}
                onChange={(event) =>
                  setLocalSettings((previous) => ({
                    ...previous,
                    repoOverride: {
                      ...repoFields,
                      owner: event.target.value,
                    },
                  }))
                }
              />
            </label>
            <label>
              Repo
              <input
                className="text-input"
                type="text"
                value={repoFields.repo}
                disabled={!overrideRepo}
                onChange={(event) =>
                  setLocalSettings((previous) => ({
                    ...previous,
                    repoOverride: {
                      ...repoFields,
                      repo: event.target.value,
                    },
                  }))
                }
              />
            </label>
            <label>
              Branch
              <input
                className="text-input"
                type="text"
                value={repoFields.branch}
                disabled={!overrideRepo}
                onChange={(event) =>
                  setLocalSettings((previous) => ({
                    ...previous,
                    repoOverride: {
                      ...repoFields,
                      branch: event.target.value,
                    },
                  }))
                }
              />
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h3>Default AI Workspace</h3>
          <label>
            Model
            <input
              className="text-input"
              type="text"
              value={localSettings.defaultWorkspaceTemplate.model}
              onChange={(event) =>
                setLocalSettings((previous) => ({
                  ...previous,
                  defaultWorkspaceTemplate: {
                    ...previous.defaultWorkspaceTemplate,
                    model: event.target.value,
                  },
                }))
              }
            />
          </label>
          <label>
            System prompt
            <textarea
              className="text-area"
              rows={5}
              value={localSettings.defaultWorkspaceTemplate.systemPrompt}
              onChange={(event) =>
                setLocalSettings((previous) => ({
                  ...previous,
                  defaultWorkspaceTemplate: {
                    ...previous.defaultWorkspaceTemplate,
                    systemPrompt: event.target.value,
                  },
                }))
              }
            />
          </label>
          <div className="settings-grid">
            <label>
              Temperature
              <input
                className="text-input"
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={localSettings.defaultWorkspaceTemplate.temperature}
                onChange={(event) =>
                  setLocalSettings((previous) => ({
                    ...previous,
                    defaultWorkspaceTemplate: {
                      ...previous.defaultWorkspaceTemplate,
                      temperature: Number(event.target.value),
                    },
                  }))
                }
              />
            </label>
            <label>
              Max completion tokens
              <input
                className="text-input"
                type="number"
                min={64}
                max={32768}
                step={64}
                value={localSettings.defaultWorkspaceTemplate.maxCompletionTokens}
                onChange={(event) =>
                  setLocalSettings((previous) => ({
                    ...previous,
                    defaultWorkspaceTemplate: {
                      ...previous.defaultWorkspaceTemplate,
                      maxCompletionTokens: Number(event.target.value),
                    },
                  }))
                }
              />
            </label>
            <label>
              Default view
              <select
                className="select-input"
                value={localSettings.uiPrefs.activeView}
                onChange={(event) =>
                  setLocalSettings((previous) => ({
                    ...previous,
                    uiPrefs: {
                      ...previous.uiPrefs,
                      activeView: event.target.value as "ai" | "files",
                    },
                  }))
                }
              >
                <option value="ai">AI Chat</option>
                <option value="files">Files</option>
              </select>
            </label>
          </div>
          <label className="checkbox-row">
            <input
              checked={localSettings.defaultWorkspaceTemplate.autoAttachActiveFile}
              onChange={(event) =>
                setLocalSettings((previous) => ({
                  ...previous,
                  defaultWorkspaceTemplate: {
                    ...previous.defaultWorkspaceTemplate,
                    autoAttachActiveFile: event.target.checked,
                  },
                }))
              }
              type="checkbox"
            />
            Auto-attach the selected file
          </label>
          <label className="checkbox-row">
            <input
              checked={localSettings.defaultWorkspaceTemplate.autoAttachRelatedFiles}
              onChange={(event) =>
                setLocalSettings((previous) => ({
                  ...previous,
                  defaultWorkspaceTemplate: {
                    ...previous.defaultWorkspaceTemplate,
                    autoAttachRelatedFiles: event.target.checked,
                  },
                }))
              }
              type="checkbox"
            />
            Auto-attach related canon files
          </label>
        </section>

        <div className="modal-footer">
          <button className="ghost-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="solid-button"
            onClick={() =>
              onSave({
                ...localSettings,
                repoOverride: overrideRepo
                  ? {
                      owner: repoFields.owner,
                      repo: repoFields.repo,
                      branch: repoFields.branch,
                    }
                  : undefined,
              })
            }
            type="button"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
