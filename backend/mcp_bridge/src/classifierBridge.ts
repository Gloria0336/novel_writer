/**
 * Thin shim — shell out to `py -3.14 -m classifier ...`.
 *
 * 設計原則：
 *   - 不在 TS 重實作分類器邏輯（避免雙份維護 taxonomy / schema / prompts）
 *   - 永遠透過 Python CLI；CLI 已負責 novel_db 唯讀的 hard guard
 *   - 提供 preview / route / campaign management 的 HTTP 對外面
 */

import { spawn } from "node:child_process";
import { resolve } from "node:path";

const PYTHON_CMD = process.env.NOVEL_WRITER_PYTHON ?? "py";
const PYTHON_ARGS_PREFIX = (process.env.NOVEL_WRITER_PYTHON_ARGS ?? "-3.14").split(/\s+/).filter(Boolean);

/** classifier 套件位於 backend/，必須從那邊呼叫 `python -m classifier`。 */
const BACKEND_CWD = resolve(__dirname, "..", "..");

export interface ClassifierResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  parsed?: unknown;
}

async function runClassifier(args: string[], stdin?: string): Promise<ClassifierResult> {
  return new Promise((resolvePromise, reject) => {
    const fullArgs = [...PYTHON_ARGS_PREFIX, "-m", "classifier", ...args];
    const proc = spawn(PYTHON_CMD, fullArgs, {
      cwd: BACKEND_CWD,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => (stdout += chunk.toString("utf8")));
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString("utf8")));
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      const result: ClassifierResult = {
        stdout,
        stderr,
        exitCode: code ?? -1,
      };
      try {
        result.parsed = JSON.parse(stdout);
      } catch {
        // 非 JSON 輸出（taxonomy-doc 等）→ 略過 parsed
      }
      resolvePromise(result);
    });

    if (stdin !== undefined) {
      proc.stdin.write(stdin);
      proc.stdin.end();
    } else {
      proc.stdin.end();
    }
  });
}

// ── 對外 API ──────────────────────────────────────────────────────────────

export interface PreviewBlobRequest {
  rawText: string;
  novelId?: string;
  campaignId?: string;
}

/** 純 dry-run：分類一段 markdown，不寫檔。 */
export async function previewBlob(req: PreviewBlobRequest): Promise<ClassifierResult> {
  const args = ["preview", "--stdin", "--json", "--no-llm"];
  if (req.campaignId) args.push("--campaign-id", req.campaignId);
  if (req.novelId) args.push("--novel-id", req.novelId);
  return runClassifier(args, req.rawText);
}

export interface RouteBlobRequest extends PreviewBlobRequest {
  apply?: boolean;
  allowNsfw?: boolean;
  useLlm?: boolean;
}

/** 分類並（可選）落地到 campaign staging working/。 */
export async function routeBlob(req: RouteBlobRequest): Promise<ClassifierResult> {
  const args = ["route", "--stdin", "--json"];
  if (req.campaignId) args.push("--campaign-id", req.campaignId);
  if (req.novelId) args.push("--novel-id", req.novelId);
  if (req.apply) {
    args.push("--apply", "--yes");
  }
  if (req.allowNsfw) args.push("--allow-nsfw");
  if (!req.useLlm) args.push("--no-llm");
  return runClassifier(args, req.rawText);
}

export async function campaignNew(campaignId: string, novelId: string, overwrite = false): Promise<ClassifierResult> {
  const args = ["campaign", "new", "--campaign-id", campaignId, "--novel-id", novelId, "--json"];
  if (overwrite) args.push("--overwrite");
  return runClassifier(args);
}

export async function campaignList(): Promise<ClassifierResult> {
  return runClassifier(["campaign", "list", "--json"]);
}

export async function campaignStatus(campaignId: string): Promise<ClassifierResult> {
  return runClassifier(["campaign", "status", "--campaign-id", campaignId, "--json"]);
}

export async function campaignExport(campaignId: string, timestamp?: string): Promise<ClassifierResult> {
  const args = ["campaign", "export", "--campaign-id", campaignId, "--json"];
  if (timestamp) args.push("--timestamp", timestamp);
  return runClassifier(args);
}

export async function campaignDelete(campaignId: string): Promise<ClassifierResult> {
  return runClassifier(["campaign", "delete", "--campaign-id", campaignId, "--yes"]);
}

export async function taxonomyDoc(): Promise<ClassifierResult> {
  return runClassifier(["taxonomy-doc"]);
}
