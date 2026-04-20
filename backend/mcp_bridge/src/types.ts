export interface RepoRef {
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

export interface LoadedFile {
  path: string;
  sha: string;
  content: string;
  isEditable: boolean;
  readOnlyReason?: string;
}

export interface DraftEntry {
  path: string;
  originalSha: string;
  originalContent: string;
  draftContent: string;
  isEditable: boolean;
  readOnlyReason?: string;
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
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  sourceFilePaths: string[];
  proposedContent?: string;
  targetPath?: string;
}

export interface RepoTreeResponse {
  entries: RepoTreeEntry[];
  headSha: string;
  baseTreeSha: string;
  truncated: boolean;
}

export interface CommitFileInput {
  path: string;
  content: string;
}

export interface CommitRequest {
  repoRef: RepoRef;
  headSha: string;
  baseTreeSha: string;
  message: string;
  files: CommitFileInput[];
}

export interface AiChatRequest {
  repoRef: RepoRef;
  workspace: WorkspaceConfig;
  history: WorkspaceMessage[];
  prompt: string;
  attachedDrafts: DraftEntry[];
  repoStructure?: string;
  targetPath?: string;
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
