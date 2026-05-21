import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { app } from "electron";

interface EnvBag {
  values: Record<string, string>;
  loadedFrom: string | null;
}

const bag: EnvBag = { values: {}, loadedFrom: null };

function parseEnvFile(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

function candidatePaths(): string[] {
  const appPath = app.getAppPath();
  const cwd = process.cwd();
  const list: (string | undefined)[] = [
    process.env["WORKSPACE_ENV_PATH"],
    resolve(appPath, "../../../../workspace.env"),
    resolve(appPath, "../../../workspace.env"),
    resolve(appPath, "../../workspace.env"),
    resolve(cwd, "../../../workspace.env"),
    resolve(cwd, "../../workspace.env"),
    resolve(cwd, "workspace.env"),
  ];
  return list.filter((p): p is string => typeof p === "string" && p.length > 0);
}

export function loadWorkspaceEnv(): void {
  const candidates = candidatePaths();
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    try {
      const content = readFileSync(p, "utf-8");
      bag.values = parseEnvFile(content);
      bag.loadedFrom = p;
      console.log(`[llm] loaded workspace.env from ${p}`);
      return;
    } catch (err) {
      console.warn(`[llm] failed reading ${p}:`, err);
    }
  }
  console.warn("[llm] workspace.env not found. Tried:", candidates);
}

export function getEnv(key: string): string | undefined {
  const v = bag.values[key];
  if (v && v.length > 0) return v;
  const fromProcess = process.env[key];
  return fromProcess && fromProcess.length > 0 ? fromProcess : undefined;
}

export function getOpenRouterKey(): string | undefined {
  return getEnv("OPENROUTER_API_KEY");
}

export function getOpenRouterBaseUrl(): string {
  return getEnv("OPENROUTER_BASE_URL") ?? "https://openrouter.ai/api/v1";
}

export function getOpenRouterSiteUrl(): string | undefined {
  return getEnv("OPENROUTER_SITE_URL");
}

export function getOpenRouterSiteName(): string | undefined {
  return getEnv("OPENROUTER_SITE_NAME");
}

export function getEnvLoadedFrom(): string | null {
  return bag.loadedFrom;
}
