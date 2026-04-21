import { readdir, readFile, stat } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { OPERA_BASE_URL } from "./config.js";
import { tryDecodeUtf8 } from "./fileAccess.js";
import type {
  OperaCollectedFile,
  OperaExportRequest,
  OperaExportResponse,
  OperaStatusResponse,
} from "./types.js";

const WORKSPACE_ROOT = resolve(process.cwd(), "..", "..");
const NOVEL_DB_ROOT = resolve(WORKSPACE_ROOT, "backend", "novel_db");
const NOVEL_ID_PATTERN = /^novel_[A-Za-z0-9_]+$/;
const CHAPTER_FILE_PATTERN = /^chapters\/ch\d+\.md$/i;
const CONTEXT_FILE_PATTERN = /^context\/(CONTEXT\.md|last-chapter-summary\.md|secrets-lockbox\.md)$/i;

function parseErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Opera integration error.";
}

function ensureValidNovelId(novelId: string): string {
  if (!NOVEL_ID_PATTERN.test(novelId)) {
    throw new Error("Invalid novelId.");
  }
  return novelId;
}

function buildNovelRoot(novelId: string): string {
  return resolve(NOVEL_DB_ROOT, ensureValidNovelId(novelId));
}

function toProjectPath(absolutePath: string): string {
  return relative(WORKSPACE_ROOT, absolutePath).split(sep).join("/");
}

function isAllowedExportPath(relativePath: string): boolean {
  return (
    CHAPTER_FILE_PATTERN.test(relativePath) ||
    CONTEXT_FILE_PATTERN.test(relativePath) ||
    relativePath.startsWith("bible/") ||
    relativePath.startsWith("outline/")
  );
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("Opera returned invalid JSON.");
  }
}

async function parseFailedResponse(response: Response): Promise<string> {
  const body = await response.text();
  if (!body.trim()) {
    return `Opera request failed with ${response.status}.`;
  }
  try {
    const parsed = JSON.parse(body) as { detail?: string; error?: string };
    return parsed.detail ?? parsed.error ?? body;
  } catch {
    return body;
  }
}

async function walkAllowedFiles(
  rootPath: string,
  currentPath: string,
  novelId: string,
  files: OperaCollectedFile[],
  warnings: string[],
): Promise<void> {
  const children = (await readdir(currentPath, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name));

  for (const child of children) {
    if (child.name === "temp") {
      continue;
    }

    const absolutePath = resolve(currentPath, child.name);
    if (child.isDirectory()) {
      await walkAllowedFiles(rootPath, absolutePath, novelId, files, warnings);
      continue;
    }
    if (!child.isFile()) {
      continue;
    }

    const relativePath = relative(rootPath, absolutePath).split(sep).join("/");
    if (!isAllowedExportPath(relativePath)) {
      continue;
    }

    const projectPath = toProjectPath(absolutePath);
    if (!projectPath.startsWith(`backend/novel_db/${novelId}/`)) {
      warnings.push(`Skipped unexpected path outside ${novelId}: ${projectPath}.`);
      continue;
    }

    const buffer = await readFile(absolutePath);
    const bytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    try {
      files.push({
        path: projectPath,
        content: tryDecodeUtf8(bytes),
      });
    } catch {
      warnings.push(`Skipped non-UTF-8 file: ${projectPath}.`);
    }
  }
}

async function collectNovelFiles(novelId: string): Promise<{ files: OperaCollectedFile[]; warnings: string[] }> {
  const warnings: string[] = [];
  const files: OperaCollectedFile[] = [];
  const novelRoot = buildNovelRoot(novelId);
  const stats = await stat(novelRoot).catch(() => null);
  if (!stats?.isDirectory()) {
    throw new Error(`Novel not found: ${novelId}.`);
  }

  await walkAllowedFiles(novelRoot, novelRoot, novelId, files, warnings);
  files.sort((left, right) => left.path.localeCompare(right.path));
  return { files, warnings };
}

export async function getOperaStatus(): Promise<OperaStatusResponse> {
  try {
    const response = await fetch(`${OPERA_BASE_URL}/integrations/novel-writer/status`);
    if (!response.ok) {
      return {
        ok: false,
        reachable: false,
        baseUrl: OPERA_BASE_URL,
        supportedSecretHandling: ["director_only"],
        error: await parseFailedResponse(response),
      };
    }

    const payload = await parseJsonResponse<{
      ok?: boolean;
      service?: string;
      supportedSecretHandling?: string[];
    }>(response);
    return {
      ok: payload.ok !== false,
      reachable: true,
      baseUrl: OPERA_BASE_URL,
      service: payload.service,
      supportedSecretHandling: payload.supportedSecretHandling ?? ["director_only"],
    };
  } catch (error) {
    return {
      ok: false,
      reachable: false,
      baseUrl: OPERA_BASE_URL,
      supportedSecretHandling: ["director_only"],
      error: parseErrorMessage(error),
    };
  }
}

export async function exportNovelToOpera(request: OperaExportRequest): Promise<OperaExportResponse> {
  const novelId = ensureValidNovelId(request.novelId);
  const options = request.options ?? { secretHandling: "director_only" as const };
  const { files, warnings } = await collectNovelFiles(novelId);

  if (files.length === 0) {
    throw new Error(`No exportable files were found for ${novelId}.`);
  }

  const response = await fetch(`${OPERA_BASE_URL}/integrations/novel-writer/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      novelId,
      files,
      options,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseFailedResponse(response));
  }

  const payload = await parseJsonResponse<OperaExportResponse>(response);
  return {
    ...payload,
    warnings: [...warnings, ...(payload.warnings ?? [])],
  };
}
