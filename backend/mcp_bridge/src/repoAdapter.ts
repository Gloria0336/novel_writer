import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { getEditableStatus, tryDecodeUtf8 } from "./fileAccess.js";
import type { CommitFileInput, CommitResult, LoadedFile, RepoRef, RepoTreeResponse } from "./types.js";

const execFileAsync = promisify(execFile);

const WORKSPACE_ROOT = resolve(process.cwd(), "..", "..");
const NOVEL_DB_ROOT = resolve(WORKSPACE_ROOT, "backend", "novel_db");

export class RepoAuthError extends Error {}
export class RepoConflictError extends Error {}

type GitFailure = Error & {
  code?: number | string;
  stdout?: string;
  stderr?: string;
};

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
    push?: boolean;
  }): Promise<CommitResult>;
}

function toProjectPath(absolutePath: string): string {
  return relative(WORKSPACE_ROOT, absolutePath).split(sep).join("/");
}

function ensureWithinNovelDb(projectPath: string): string {
  const resolvedPath = resolve(WORKSPACE_ROOT, projectPath);
  const relativeToNovelDb = relative(NOVEL_DB_ROOT, resolvedPath);
  if (relativeToNovelDb.startsWith("..") || resolve(NOVEL_DB_ROOT, relativeToNovelDb) !== resolvedPath) {
    throw new Error("Path must stay within backend/novel_db.");
  }
  return resolvedPath;
}

function buildSha(input: string): string {
  return createHash("sha1").update(input).digest("hex");
}

async function collectEntries(root: string): Promise<RepoTreeResponse["entries"]> {
  const entries: RepoTreeResponse["entries"] = [];

  const walk = async (directoryPath: string) => {
    const children = (await readdir(directoryPath, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name));

    for (const child of children) {
      const absolutePath = resolve(directoryPath, child.name);
      const stats = await stat(absolutePath);
      const projectPath = toProjectPath(absolutePath);
      const sha = buildSha(`${projectPath}:${stats.mtimeMs}:${stats.size}`);

      if (child.isDirectory()) {
        entries.push({
          path: projectPath,
          sha,
          type: "tree",
        });
        await walk(absolutePath);
      } else if (child.isFile()) {
        entries.push({
          path: projectPath,
          sha,
          size: stats.size,
          type: "blob",
        });
      }
    }
  };

  await walk(root);
  return entries;
}

async function runGit(args: string[]): Promise<{ stdout: string; stderr: string }> {
  try {
    const result = await execFileAsync("git", args, {
      cwd: WORKSPACE_ROOT,
      windowsHide: true,
    });
    return {
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    };
  } catch (error) {
    const failure = error as GitFailure;
    const message = failure.stderr?.trim() || failure.stdout?.trim() || `git ${args.join(" ")} failed.`;
    throw new Error(message);
  }
}

async function canResolveGit(args: string[]): Promise<boolean> {
  try {
    await runGit(args);
    return true;
  } catch {
    return false;
  }
}

export class LocalFsRepoAdapter implements RepoAdapter {
  readonly name = "local-fs";

  async listTree(_repoRef: RepoRef): Promise<RepoTreeResponse> {
    const entries = await collectEntries(NOVEL_DB_ROOT);
    const treeSha = buildSha(entries.map((entry) => `${entry.type}:${entry.path}:${entry.sha}`).join("|"));

    return {
      entries,
      headSha: treeSha,
      baseTreeSha: treeSha,
      truncated: false,
    };
  }

  async readFile(_repoRef: RepoRef, path: string, sha: string): Promise<LoadedFile> {
    const absolutePath = ensureWithinNovelDb(path);
    const buffer = await readFile(absolutePath);
    const editable = getEditableStatus(path);
    const bytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    try {
      return {
        path,
        sha,
        content: tryDecodeUtf8(bytes),
        isEditable: editable.isEditable,
        readOnlyReason: editable.reason,
      };
    } catch {
      return {
        path,
        sha,
        content: "",
        isEditable: false,
        readOnlyReason: "This file is not valid UTF-8 text and cannot be edited in the browser.",
      };
    }
  }

  async commitFiles(params: {
    repoRef: RepoRef;
    headSha: string;
    baseTreeSha: string;
    message: string;
    files: CommitFileInput[];
    push?: boolean;
  }): Promise<CommitResult> {
    if (params.files.length === 0) {
      throw new Error("No files were selected for commit.");
    }

    const currentBranch = (await runGit(["branch", "--show-current"])).stdout;
    if (!currentBranch) {
      throw new Error("The workspace is not on a named git branch.");
    }
    if (currentBranch !== params.repoRef.branch) {
      throw new Error(`The workspace is checked out on ${currentBranch}, not ${params.repoRef.branch}.`);
    }

    const projectPaths: string[] = [];

    for (const file of params.files) {
      ensureWithinNovelDb(file.path);
      const editable = getEditableStatus(file.path);
      if (!editable.isEditable) {
        throw new Error(editable.reason ?? `File is not editable: ${file.path}`);
      }
      await writeFile(resolve(WORKSPACE_ROOT, file.path), file.content, "utf8");
      projectPaths.push(file.path);
    }

    const statusResult = await runGit(["status", "--porcelain", "--", ...projectPaths]);
    if (!statusResult.stdout) {
      throw new Error("No git changes were detected for the selected files.");
    }

    await runGit(["add", "--", ...projectPaths]);
    await runGit(["commit", "-m", params.message, "--only", "--", ...projectPaths]);
    const commitSha = (await runGit(["rev-parse", "HEAD"])).stdout;

    if (params.push) {
      const hasOriginRemote = await canResolveGit(["remote", "get-url", "origin"]);
      if (!hasOriginRemote) {
        throw new Error("Git remote 'origin' is not configured, so push is unavailable.");
      }

      await runGit(["push", "origin", `HEAD:${params.repoRef.branch}`]);
    }

    return {
      commitSha,
      pushed: Boolean(params.push),
      pushedBranch: params.push ? params.repoRef.branch : undefined,
    };
  }
}
