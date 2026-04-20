import { GITHUB_API_VERSION, GITHUB_TOKEN } from "./config.js";
import { getEditableStatus, tryDecodeUtf8 } from "./fileAccess.js";
import type { CommitFileInput, LoadedFile, RepoRef, RepoTreeResponse } from "./types.js";

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
  truncated: boolean;
  tree: Array<{
    path: string;
    sha: string;
    size?: number;
    type: "blob" | "tree";
  }>;
}

interface CreateTreeResponse {
  sha: string;
}

interface CreateCommitResponse {
  sha: string;
}

export class RepoAuthError extends Error {}
export class RepoConflictError extends Error {}

export interface RepoAdapter {
  readonly name: string;
  listTree(repoRef: RepoRef): Promise<RepoTreeResponse>;
  readFile(repoRef: RepoRef, path: string, sha: string): Promise<LoadedFile>;
  commitFiles(params: {
    repoRef: RepoRef;
    headSha: string;
    baseTreeSha: string;
    message: string;
    files: CommitFileInput[];
  }): Promise<string>;
}

function buildHeaders(extraHeaders?: HeadersInit): HeadersInit {
  if (!GITHUB_TOKEN) {
    throw new RepoAuthError("NOVEL_WRITER_GITHUB_TOKEN is not configured for the bridge.");
  }

  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    ...extraHeaders,
  };
}

function encodePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function parseGitHubError(response: Response): Promise<Error> {
  if (response.status === 401 || response.status === 403) {
    return new RepoAuthError("The configured GitHub token cannot access this repository or branch.");
  }

  const body = await response.text();
  return new Error(body || `GitHub request failed with ${response.status}.`);
}

export class GitHubRestRepoAdapter implements RepoAdapter {
  readonly name = "github-rest";

  private getRepoBase(repoRef: RepoRef): string {
    return `https://api.github.com/repos/${repoRef.owner}/${repoRef.repo}`;
  }

  private async getBranchHead(repoRef: RepoRef): Promise<string> {
    const branch = encodeURIComponent(repoRef.branch);
    const response = await fetch(`${this.getRepoBase(repoRef)}/git/ref/heads/${branch}`, {
      headers: buildHeaders(),
    });

    if (!response.ok) {
      throw await parseGitHubError(response);
    }

    const data = (await response.json()) as GitReferenceResponse;
    return data.object.sha;
  }

  private async getCommitTreeSha(repoRef: RepoRef, commitSha: string): Promise<string> {
    const response = await fetch(`${this.getRepoBase(repoRef)}/git/commits/${commitSha}`, {
      headers: buildHeaders(),
    });

    if (!response.ok) {
      throw await parseGitHubError(response);
    }

    const data = (await response.json()) as GitCommitResponse;
    return data.tree.sha;
  }

  async listTree(repoRef: RepoRef): Promise<RepoTreeResponse> {
    const headSha = await this.getBranchHead(repoRef);
    const baseTreeSha = await this.getCommitTreeSha(repoRef, headSha);
    const response = await fetch(`${this.getRepoBase(repoRef)}/git/trees/${baseTreeSha}?recursive=1`, {
      headers: buildHeaders(),
    });

    if (!response.ok) {
      throw await parseGitHubError(response);
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

  async readFile(repoRef: RepoRef, path: string, sha: string): Promise<LoadedFile> {
    const response = await fetch(
      `${this.getRepoBase(repoRef)}/contents/${encodePath(path)}?ref=${encodeURIComponent(repoRef.branch)}`,
      {
        headers: buildHeaders({
          Accept: "application/vnd.github.raw",
        }),
      },
    );

    if (!response.ok) {
      throw await parseGitHubError(response);
    }

    const buffer = await response.arrayBuffer();
    const editable = getEditableStatus(path);

    try {
      return {
        path,
        sha,
        content: tryDecodeUtf8(buffer),
        isEditable: editable.isEditable,
        readOnlyReason: editable.reason,
      };
    } catch {
      return {
        path,
        sha,
        content: "",
        isEditable: false,
        readOnlyReason: "This file could not be decoded as UTF-8 text.",
      };
    }
  }

  async commitFiles(params: {
    repoRef: RepoRef;
    headSha: string;
    baseTreeSha: string;
    message: string;
    files: CommitFileInput[];
  }): Promise<string> {
    const latestHead = await this.getBranchHead(params.repoRef);
    if (latestHead !== params.headSha) {
      throw new RepoConflictError("The repository head changed. Refresh the tree before committing.");
    }

    const treeResponse = await fetch(`${this.getRepoBase(params.repoRef)}/git/trees`, {
      method: "POST",
      headers: {
        ...buildHeaders(),
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
      throw await parseGitHubError(treeResponse);
    }

    const createdTree = (await treeResponse.json()) as CreateTreeResponse;
    const commitResponse = await fetch(`${this.getRepoBase(params.repoRef)}/git/commits`, {
      method: "POST",
      headers: {
        ...buildHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: params.message,
        tree: createdTree.sha,
        parents: [latestHead],
      }),
    });

    if (!commitResponse.ok) {
      throw await parseGitHubError(commitResponse);
    }

    const createdCommit = (await commitResponse.json()) as CreateCommitResponse;
    const updateResponse = await fetch(
      `${this.getRepoBase(params.repoRef)}/git/refs/heads/${encodeURIComponent(params.repoRef.branch)}`,
      {
        method: "PATCH",
        headers: {
          ...buildHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sha: createdCommit.sha,
          force: false,
        }),
      },
    );

    if (!updateResponse.ok) {
      if (updateResponse.status === 409 || updateResponse.status === 422) {
        throw new RepoConflictError("GitHub rejected the ref update because the branch moved.");
      }

      throw await parseGitHubError(updateResponse);
    }

    return createdCommit.sha;
  }
}
