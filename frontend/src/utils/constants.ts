import type { AppSettings, CommitDraft, RepoConfig, WorkspaceConfig, WorkspaceTemplate } from "../types/app";

export const STORAGE_SCHEMA_VERSION = 1;
export const STORAGE_PREFIX = "novel-writer-ui";
export const GITHUB_API_VERSION = "2022-11-28";

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
    "你是小說寫作助理。請以繁體中文協助整理設定、改寫段落、延伸靈感與檢查前後一致性。若使用者要直接修改文檔，請盡量回覆可直接貼回編輯器的內容。",
  temperature: 0.7,
  maxCompletionTokens: 1200,
  autoAttachActiveFile: true,
};

export const DEFAULT_UI_PREFS = {
  sidebarOpen: true,
  sidebarWidth: 240,
  dockOpen: true,
  dockHeight: 240,
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
    name: name ?? "新對話",
    model: template.model,
    systemPrompt: template.systemPrompt,
    temperature: template.temperature,
    maxCompletionTokens: template.maxCompletionTokens,
    attachedPaths: [],
    autoAttachActiveFile: template.autoAttachActiveFile,
  };
}
