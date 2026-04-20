import type { AppSettings, CommitDraft, RepoConfig, WorkspaceConfig, WorkspaceTemplate } from "../types/app";

export const STORAGE_SCHEMA_VERSION = 2;
export const STORAGE_PREFIX = "novel-writer-ui";
export const GITHUB_API_VERSION = "2022-11-28";
export const DEFAULT_BRIDGE_BASE_URL = "http://127.0.0.1:8787";

export const DEFAULT_REPO_CONFIG: RepoConfig = {
  owner: "Gloria0336",
  repo: "novel_writer",
  branch: "main",
};

export const DEFAULT_COMMIT_DRAFT: CommitDraft = {
  message: "",
  branch: DEFAULT_REPO_CONFIG.branch,
  includedPaths: [],
};

export const DEFAULT_WORKSPACE_TEMPLATE: WorkspaceTemplate = {
  model: "openai/gpt-4o-mini",
  systemPrompt:
    "You are a careful novel revision assistant. Keep canon and structure consistent, explain your reasoning briefly, and return production-ready rewrites when asked.",
  temperature: 0.7,
  maxCompletionTokens: 1200,
  autoAttachActiveFile: true,
  autoAttachRelatedFiles: true,
};

export const DEFAULT_UI_PREFS = {
  activeView: "ai" as const,
  sidebarOpen: true,
  sidebarWidth: 240,
  dockOpen: true,
  dockHeight: 280,
  favoriteModels: [] as string[],
  recentModels: [] as string[],
};

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: STORAGE_SCHEMA_VERSION,
  uiPrefs: DEFAULT_UI_PREFS,
  defaultWorkspaceTemplate: DEFAULT_WORKSPACE_TEMPLATE,
};

export function createWorkspaceConfig(template: WorkspaceTemplate, name?: string): WorkspaceConfig {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `ws-${Date.now()}`;
  return {
    id,
    name: name ?? "Workspace",
    model: template.model,
    systemPrompt: template.systemPrompt,
    temperature: template.temperature,
    maxCompletionTokens: template.maxCompletionTokens,
    attachedPaths: [],
    autoAttachActiveFile: template.autoAttachActiveFile,
    autoAttachRelatedFiles: template.autoAttachRelatedFiles,
  };
}
