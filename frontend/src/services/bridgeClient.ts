import type {
  AiChatResponse,
  BridgeStatus,
  DraftEntry,
  LoadedFile,
  ModelInfo,
  OperaExportOptions,
  OperaExportResponse,
  OperaIntegrationStatus,
  RepoCommitResult,
  RepoConfig,
  RepoSnapshot,
  WorkspaceConfig,
  WorkspaceMessage,
} from "../types/app";
import { DEFAULT_BRIDGE_BASE_URL } from "../utils/constants";

interface CommitRequest {
  repoRef: RepoConfig;
  headSha: string;
  baseTreeSha: string;
  message: string;
  files: Array<{ path: string; content: string }>;
  push?: boolean;
}

interface ChatRequest {
  repoRef: RepoConfig;
  workspace: WorkspaceConfig;
  history: WorkspaceMessage[];
  prompt: string;
  attachedDrafts: DraftEntry[];
  repoStructure?: string;
  targetPath?: string;
}

interface OperaExportRequest {
  novelId: string;
  options?: OperaExportOptions;
}

export class BridgeConflictError extends Error {}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("The bridge returned invalid JSON.");
  }
}

async function parseError(response: Response): Promise<Error> {
  const bodyText = await response.text();
  let parsedError = "";
  if (bodyText) {
    try {
      parsedError = ((JSON.parse(bodyText) as { error?: string }).error ?? "").trim();
    } catch {
      parsedError = bodyText.trim();
    }
  }
  if (response.status === 409) {
    return new BridgeConflictError(parsedError || "The branch changed on the server.");
  }
  return new Error(parsedError || `Bridge request failed with ${response.status}.`);
}

function queryForRepo(repoRef: RepoConfig): string {
  const params = new URLSearchParams({
    owner: repoRef.owner,
    repo: repoRef.repo,
    branch: repoRef.branch,
  });
  return params.toString();
}

export class BridgeClient {
  constructor(private readonly baseUrl = import.meta.env.VITE_BRIDGE_BASE_URL ?? DEFAULT_BRIDGE_BASE_URL) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, init);
    if (!response.ok) {
      throw await parseError(response);
    }
    return parseJson<T>(response);
  }

  async getStatus(): Promise<BridgeStatus> {
    return this.request<BridgeStatus>("/api/status");
  }

  async getRepoTree(repoRef: RepoConfig): Promise<RepoSnapshot> {
    return this.request<RepoSnapshot>(`/api/repo/tree?${queryForRepo(repoRef)}`);
  }

  async getFileContent(repoRef: RepoConfig, path: string, sha: string): Promise<LoadedFile> {
    const params = new URLSearchParams({
      owner: repoRef.owner,
      repo: repoRef.repo,
      branch: repoRef.branch,
      path,
      sha,
    });
    return this.request<LoadedFile>(`/api/repo/file?${params.toString()}`);
  }

  async getModels(): Promise<ModelInfo[]> {
    const result = await this.request<{ models: ModelInfo[] }>("/api/ai/models", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    return result.models;
  }

  async sendChat(request: ChatRequest): Promise<AiChatResponse> {
    return this.request<AiChatResponse>("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  }

  async createCommit(request: CommitRequest): Promise<RepoCommitResult> {
    return this.request<RepoCommitResult>("/api/repo/commit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  }

  async getOperaStatus(): Promise<OperaIntegrationStatus> {
    return this.request<OperaIntegrationStatus>("/api/integrations/opera/status");
  }

  async exportNovelToOpera(request: OperaExportRequest): Promise<OperaExportResponse> {
    return this.request<OperaExportResponse>("/api/integrations/opera/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  }
}
