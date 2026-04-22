import type { AppSettings, CommitDraft, RepoConfig, TweakSettings, WorkspaceConfig, WorkspaceTemplate } from "../types/app";

export const STORAGE_SCHEMA_VERSION = 3;
export const STORAGE_PREFIX = "novel-writer-ui";
export const GITHUB_API_VERSION = "2022-11-28";
export const DEFAULT_BRIDGE_BASE_URL = "http://127.0.0.1:8787";
export const DEFAULT_OPERA_FRONTEND_URL = import.meta.env.VITE_OPERA_FRONTEND_URL ?? "http://127.0.0.1:5173";
export const NOVEL_DB_ROOT_PATH = "backend/novel_db";
export const MAX_ATTACHED_REFERENCE_FILES = 20;

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
    "你是專業的小說修稿助理。請維持既有世界觀與人物口吻，回覆簡潔；若使用者要求改稿，請提供可直接套用的完整檔案內容。",
  temperature: 0.75,
  maxCompletionTokens: 2200,
  autoAttachActiveFile: true,
  autoAttachRelatedFiles: true,
};

export const DEFAULT_UI_PREFS = {
  activeView: "ai" as const,
  sidebarOpen: true,
  sidebarWidth: 260,
  dockOpen: false,
  dockHeight: 280,
  favoriteModels: [] as string[],
  recentModels: [] as string[],
  tweaksOpen: false,
};

export const DEFAULT_TWEAKS: TweakSettings = {
  uiFont: "Instrument Sans",
  editorFont: "Lora",
  fontSize: 16,
  editorFontSize: 18,
  editorLineHeight: 1.8,
};

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: STORAGE_SCHEMA_VERSION,
  uiPrefs: DEFAULT_UI_PREFS,
  defaultWorkspaceTemplate: DEFAULT_WORKSPACE_TEMPLATE,
  openRouterApiKey: "",
  tweaks: DEFAULT_TWEAKS,
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
