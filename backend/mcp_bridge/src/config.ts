import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const contents = readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    process.env[key] = stripWrappingQuotes(rawValue);
  }
}

loadDotEnv();

export const BRIDGE_PORT = Number(process.env.NOVEL_WRITER_BRIDGE_PORT ?? "8787");
export const GITHUB_TOKEN = process.env.NOVEL_WRITER_GITHUB_TOKEN;
export const OPENROUTER_API_KEY = process.env.NOVEL_WRITER_OPENROUTER_API_KEY;

export const GITHUB_API_VERSION = "2022-11-28";
export const OPENROUTER_REFERER = "http://127.0.0.1:4173/";
export const OPENROUTER_TITLE = "Novel Writer";
