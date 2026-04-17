import type { LoadedFile, RepoConfig, RepoTreeEntry } from "../types/app";
import { GITHUB_API_VERSION } from "../utils/constants";
import { getEditableStatus, tryDecodeUtf8 } from "../utils/fileAccess";

interface GitReferenceResponse {
  object: {
    sha: string;
  };
}

interface GitCommitResponse {
  tree: {
    sha: string;
  };
}

interface GitTreeResponse {
  sha: string;
  truncated: boolean;
  tree: Array<{
    path: string;
    sha: string;
    type: "blob" | "tree";
    size?: number;
  }>;
}

interface CreateTreeResponse {
  sha: string;
}

interface CreateCommitResponse {
  sha: string;
}

export class GitHubConflictError extends Error {}
export class GitHubAuthError extends Error {}

function encodePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildHeaders(token?: string, extraHeaders?: HeadersInit): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

async function parseError(response: Response): Promise<Error> {
  if (response.status === 401 || response.status === 403) {
    return new GitHubAuthError("GitHub PAT 無效、缺權限，或目前已命中 API 限制。");
  }

  const body = await response.text();
  return new Error(body || `GitHub request failed with ${response.status}`);
}

export class GitHubClient {
  constructor(private readonly repoConfig: RepoConfig) {}

  private get repoBase(): string {
    const { owner, repo } = this.repoConfig;
    return `https://api.github.com/repos/${owner}/${repo}`;
  }

  async getBranchHead(): Promise<string> {
    const branch = encodeURIComponent(this.repoConfig.branch);
    const response = await fetch(`${this.repoBase}/git/ref/heads/${branch}`, {
      headers: buildHeaders(this.repoConfig.githubToken),
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    const data = (await response.json()) as GitReferenceResponse;
    return data.object.sha;
  }

  async getCommitTreeSha(commitSha: string): Promise<string> {
    const response = await fetch(`${this.repoBase}/git/commits/${commitSha}`, {
      headers: buildHeaders(this.repoConfig.githubToken),
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    const data = (await response.json()) as GitCommitResponse;
    return data.tree.sha;
  }

  async getRepoTree(): Promise<{ entries: RepoTreeEntry[]; headSha: string; baseTreeSha: string; truncated: boolean }> {
    const headSha = await this.getBranchHead();
    const baseTreeSha = await this.getCommitTreeSha(headSha);

    const response = await fetch(`${this.repoBase}/git/trees/${baseTreeSha}?recursive=1`, {
      headers: buildHeaders(this.repoConfig.githubToken),
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    const data = (await response.json()) as GitTreeResponse;
    return {
      entries: data.tree.map((entry) => ({
        path: entry.path,
        sha: entry.sha,
        size: entry.size,
        type: entry.type,
      })),
      headSha,
      baseTreeSha,
      truncated: data.truncated,
    };
  }

  async getFileContent(path: string, sha: string): Promise<LoadedFile> {
    const response = await fetch(`${this.repoBase}/contents/${encodePath(path)}?ref=${encodeURIComponent(this.repoConfig.branch)}`, {
      headers: buildHeaders(this.repoConfig.githubToken, {
        Accept: "application/vnd.github.raw",
      }),
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    const buffer = await response.arrayBuffer();
    const editable = getEditableStatus(path);

    try {
      const content = tryDecodeUtf8(buffer);
      return {
        path,
        sha,
        content,
        isEditable: editable.isEditable,
        readOnlyReason: editable.reason,
      };
    } catch {
      return {
        path,
        sha,
        content: "",
        isEditable: false,
        readOnlyReason: "這個檔案不是可安全編輯的 UTF-8 文字檔，因此目前僅允許唯讀。",
      };
    }
  }

  async createCommit(params: {
    headSha: string;
    baseTreeSha: string;
    message: string;
    files: Array<{ path: string; content: string }>;
  }): Promise<string> {
    const latestHead = await this.getBranchHead();
    if (latestHead !== params.headSha) {
      throw new GitHubConflictError("branch HEAD 已更新，請先重新整理 HEAD 並確認草稿差異。");
    }

    const treeResponse = await fetch(`${this.repoBase}/git/trees`, {
      method: "POST",
      headers: {
        ...buildHeaders(this.repoConfig.githubToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base_tree: params.baseTreeSha,
        tree: params.files.map((file) => ({
          path: file.path,
          mode: "100644",
          type: "blob",
          content: file.content,
        })),
      }),
    });

    if (!treeResponse.ok) {
      throw await parseError(treeResponse);
    }

    const createdTree = (await treeResponse.json()) as CreateTreeResponse;

    const commitResponse = await fetch(`${this.repoBase}/git/commits`, {
      method: "POST",
      headers: {
        ...buildHeaders(this.repoConfig.githubToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: params.message,
        tree: createdTree.sha,
        parents: [latestHead],
      }),
    });

    if (!commitResponse.ok) {
      throw await parseError(commitResponse);
    }

    const createdCommit = (await commitResponse.json()) as CreateCommitResponse;

    const updateResponse = await fetch(`${this.repoBase}/git/refs/heads/${encodeURIComponent(this.repoConfig.branch)}`, {
      method: "PATCH",
      headers: {
        ...buildHeaders(this.repoConfig.githubToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sha: createdCommit.sha,
        force: false,
      }),
    });

    if (!updateResponse.ok) {
      if (updateResponse.status === 409 || updateResponse.status === 422) {
        throw new GitHubConflictError("提交時發現 branch 已前進，請重新整理後再提交。");
      }
      throw await parseError(updateResponse);
    }

    return createdCommit.sha;
  }

  async testConnection(): Promise<void> {
    await this.getBranchHead();
  }
}

