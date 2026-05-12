import type { BattleState } from "../core/types/battle";
import type { EnemyProfile } from "../core/ai/types";
import type { GameLogDocument, RecordOpts } from "./types";
import { summarizeGame } from "./analyze";

export { summarizeGame } from "./analyze";
export type { GameLogDocument, SessionMeta, GameSummary, TurnSummary, AIAnalytics, BugIndicators, BalanceMetrics, RecordOpts } from "./types";

function isNodeEnvironment(): boolean {
  return (
    typeof process !== "undefined" &&
    process.versions != null &&
    typeof process.versions.node === "string"
  );
}

function makeFilename(meta: GameLogDocument["meta"]): string {
  const ts = meta.timestamp.replace(/:/g, "-").replace(/\..+$/, "");
  return `${ts}-seed${meta.seed}-${meta.profileId}.json`;
}

async function recordNode(doc: GameLogDocument, logDir: string): Promise<void> {
  const { mkdir, writeFile } = await import("node:fs/promises");
  await mkdir(logDir, { recursive: true });
  const filename = makeFilename(doc.meta);
  await writeFile(`${logDir}/${filename}`, JSON.stringify(doc, null, 2), "utf-8");
}

function pruneLocalStorage(prefix: string, maxEntries: number): void {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
  if (keys.length <= maxEntries) return;
  keys.sort();
  for (const k of keys.slice(0, keys.length - maxEntries)) {
    localStorage.removeItem(k);
  }
}

async function recordBrowser(doc: GameLogDocument): Promise<void> {
  const key = `gamelog_${doc.meta.sessionId}`;
  localStorage.setItem(key, JSON.stringify(doc));
  pruneLocalStorage("gamelog_", 20);
}

/**
 * 對戰結束後呼叫此函式以儲存 log。
 * - Node.js 環境：寫入 JSON 檔案至 logDir（預設 "logs"）
 * - 瀏覽器環境：存入 localStorage，並保留最新 20 筆
 */
export async function recordGame(
  state: BattleState,
  profile: EnemyProfile,
  opts: RecordOpts = {},
): Promise<void> {
  const durationMs = opts.startTime != null ? Date.now() - opts.startTime : 0;
  const doc = summarizeGame(state, profile, { ...opts, durationMs });

  if (isNodeEnvironment()) {
    const logDir = opts.logDir ?? "logs";
    await recordNode(doc, logDir);
  } else {
    await recordBrowser(doc);
  }
}

/**
 * 觸發瀏覽器下載 log 檔案（JSON）。
 * 在遊戲 UI 中綁定到「下載 Log」按鈕即可。
 */
export function downloadLog(doc: GameLogDocument): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = makeFilename(doc.meta);
  a.click();
  URL.revokeObjectURL(url);
}
