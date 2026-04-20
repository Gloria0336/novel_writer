export type Role = "system" | "user" | "assistant";

export interface RepoRef {
  owner: string;
  repo: string;
  branch: string;
  githubToken?: string;
}

export type RepoConfig = RepoRef;

export interface RepoOverrideConfig {
  owner: string;
  repo: string;
  branch: string;
}

export interface RepoTreeEntry {
  path: string;
  sha: string;
  size?: number;
  type: "blob" | "tree";
}

export interface RepoTreeNode {
  id: string;
  name: string;
  path: string;
  kind: "file" | "directory";
  children?: RepoTreeNode[];
  entry?: RepoTreeEntry;
}

export interface DraftEntry {
  path: string;
  originalSha: string;
  originalContent: string;
  draftContent: string;
  isEditable: boolean;
  updatedAt: number;
  readOnlyReason?: string;
}

export interface CommitDraft {
  message: string;
  branch: string;
  includedPaths: string[];
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxCompletionTokens: number;
  attachedPaths: string[];
  autoAttachActiveFile: boolean;
  autoAttachRelatedFiles: boolean;
}

export interface WorkspaceMessage {
  id: string;
  role: Exclude<Role, "system">;
  content: string;
  createdAt: number;
  sourceFilePaths: string[];
  proposedContent?: string;
  targetPath?: string;
}

export interface WorkspaceTemplate {
  model: string;
  systemPrompt: string;
  temperature: number;
  maxCompletionTokens: number;
  autoAttachActiveFile: boolean;
  autoAttachRelatedFiles: boolean;
}

export interface UiPrefs {
  activeView: "ai" | "files";
  sidebarOpen: boolean;
  sidebarWidth: number;
  dockOpen: boolean;
  dockHeight: number;
  favoriteModels: string[];
  recentModels: string[];
}

export interface AppSettings {
  schemaVersion: number;
  repoOverride?: RepoOverrideConfig;
  uiPrefs: UiPrefs;
  defaultWorkspaceTemplate: WorkspaceTemplate;
}

export interface RepoSnapshot {
  entries: RepoTreeEntry[];
  headSha: string;
  baseTreeSha: string;
  truncated?: boolean;
  selectedPath?: string;
  lastFetchedAt?: number;
}

export interface WorkspaceState {
  workspaces: WorkspaceConfig[];
  activeWorkspaceId: string;
  messages: Record<string, WorkspaceMessage[]>;
}

export interface ModelInfo {
  id: string;
  name: string;
  contextLength: number;
  description?: string;
  inputModalities: string[];
  outputModalities: string[];
  supportedParameters: string[];
}

export interface LoadedFile {
  path: string;
  sha: string;
  content: string;
  isEditable: boolean;
  readOnlyReason?: string;
}

export interface OpenRouterChatRequest {
  model: string;
  messages: Array<{
    role: Role;
    content: string;
  }>;
  temperature: number;
  maxCompletionTokens: number;
}

export interface AiChatResponse {
  assistantText: string;
  proposedContent?: string;
  targetPath?: string;
}

export interface BridgeStatus {
  ok: boolean;
  repoAdapter: string;
  hasGitHubToken: boolean;
  hasOpenRouterApiKey: boolean;
}
