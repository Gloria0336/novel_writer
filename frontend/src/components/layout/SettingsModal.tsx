import { useEffect, useMemo, useState } from "react";
import type { AppSettings } from "../../types/app";
import { DEFAULT_REPO_CONFIG } from "../../utils/constants";

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSave: (nextSettings: AppSettings) => void;
  onClearSecrets: () => void;
  onTestGitHub: (token?: string) => Promise<string>;
  onTestOpenRouter: (apiKey?: string) => Promise<string>;
}

export function SettingsModal(props: SettingsModalProps) {
  const { isOpen, settings, onClose, onSave, onClearSecrets, onTestGitHub, onTestOpenRouter } = props;
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [overrideRepo, setOverrideRepo] = useState(Boolean(settings.repoOverride));
  const [githubStatus, setGitHubStatus] = useState<string>("");
  const [openRouterStatus, setOpenRouterStatus] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setLocalSettings(settings);
    setOverrideRepo(Boolean(settings.repoOverride));
    setGitHubStatus("");
    setOpenRouterStatus("");
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
            <div className="eyebrow">Secrets & defaults</div>
            <h2>Console Settings</h2>
          </div>
          <button className="ghost-button" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="settings-warning">
          此站是純前端 GitHub Pages 應用，GitHub PAT 與 OpenRouter API key 只會存進你的瀏覽器 `localStorage`。這不是安全儲存，請只使用權限最小化的 token。
        </div>

        <section className="settings-section">
          <h3>Secrets</h3>
          <label>
            GitHub fine-grained PAT
            <input
              className="text-input"
              type="password"
              value={localSettings.githubPat ?? ""}
              onChange={(event) =>
                setLocalSettings((previous) => ({
                  ...previous,
                  githubPat: event.target.value || undefined,
                }))
              }
              placeholder="ghp_..."
            />
          </label>
          <div className="inline-row">
            <button
              className="ghost-button"
              type="button"
              onClick={async () => {
                setGitHubStatus("Testing...");
                setGitHubStatus(await onTestGitHub(localSettings.githubPat));
              }}
            >
              Test GitHub
            </button>
            <span className="inline-status">{githubStatus}</span>
          </div>
          <label>
            OpenRouter API key
            <input
              className="text-input"
              type="password"
              value={localSettings.openRouterApiKey ?? ""}
              onChange={(event) =>
                setLocalSettings((previous) => ({
                  ...previous,
                  openRouterApiKey: event.target.value || undefined,
                }))
              }
              placeholder="sk-or-..."
            />
          </label>
          <div className="inline-row">
            <button
              className="ghost-button"
              type="button"
              onClick={async () => {
                setOpenRouterStatus("Testing...");
                setOpenRouterStatus(await onTestOpenRouter(localSettings.openRouterApiKey));
              }}
            >
              Test OpenRouter
            </button>
            <span className="inline-status">{openRouterStatus}</span>
          </div>
          <button className="danger-button" onClick={onClearSecrets} type="button">
            Clear saved secrets
          </button>
        </section>

        <section className="settings-section">
          <div className="inline-row">
            <h3>Repo target</h3>
            <label className="checkbox-row">
              <input checked={overrideRepo} onChange={(event) => setOverrideRepo(event.target.checked)} type="checkbox" />
              Override default repo target
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
          <h3>Default workspace template</h3>
          <label>
            Default model
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
            Default system prompt
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
            Auto-attach active file for new workspaces
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

