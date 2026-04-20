import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { getEditableStatus, tryDecodeUtf8 } from "./fileAccess.js";
import type { CommitFileInput, LoadedFile, RepoRef, RepoTreeResponse } from "./types.js";

const WORKSPACE_ROOT = resolve(process.cwd(), "..", "..");
const NOVEL_DB_ROOT = resolve(WORKSPACE_ROOT, "backend", "novel_db");

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
        readOnlyReason: "這個檔案不是可編輯的 UTF-8 文字內容。",
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
    for (const file of params.files) {
      const absolutePath = ensureWithinNovelDb(file.path);
      const editable = getEditableStatus(file.path);
      if (!editable.isEditable) {
        throw new Error(editable.reason ?? `File is not editable: ${file.path}`);
      }
      await writeFile(absolutePath, file.content, "utf8");
    }

    return buildSha(`${params.message}:${Date.now()}:${params.files.map((file) => file.path).join("|")}`);
  }
}
