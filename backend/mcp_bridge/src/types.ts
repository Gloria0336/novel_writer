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
  push?: boolean;
}

export interface CommitResult {
  commitSha: string;
  pushed: boolean;
  pushedBranch?: string;
  generatedFiles?: string[];
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

export interface OperaExportOptions {
  secretHandling: "director_only";
}

export interface OperaExportRequest {
  novelId: string;
  options?: OperaExportOptions;
}

export interface OperaCollectedFile {
  path: string;
  content: string;
}

export interface OperaImportedCounts {
  worldEntries: number;
  actors: number;
  timelineEvents: number;
  directorNotes: number;
}

export interface OperaExportResponse {
  campaignId: string;
  campaignName: string;
  importedCounts: OperaImportedCounts;
  warnings: string[];
}

export interface OperaStatusResponse {
  ok: boolean;
  reachable: boolean;
  baseUrl: string;
  service?: string;
  supportedSecretHandling: string[];
  error?: string;
}
