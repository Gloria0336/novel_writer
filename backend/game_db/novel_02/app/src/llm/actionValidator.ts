import type { GameAction } from "../core/turn/actions";

export type ValidationResult =
  | { ok: true; action: GameAction; reasoning: string; matchedByIndex: boolean }
  | { ok: false; reason: string };

interface ParsedShape {
  reasoning?: unknown;
  actionIndex?: unknown;
  action?: unknown;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  const ar = a as Record<string, unknown>;
  const br = b as Record<string, unknown>;
  const ak = Object.keys(ar).filter((k) => ar[k] !== undefined);
  const bk = Object.keys(br).filter((k) => br[k] !== undefined);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (!Object.prototype.hasOwnProperty.call(br, k)) return false;
    if (!deepEqual(ar[k], br[k])) return false;
  }
  return true;
}

function tryParseJson(text: string): ParsedShape | { error: string } {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed)) return { error: "response is not a JSON object" };
    return parsed as ParsedShape;
  } catch (err) {
    return { error: `JSON parse failed: ${String(err)}` };
  }
}

export function validateAction(rawJson: string, legalActions: GameAction[]): ValidationResult {
  const parsed = tryParseJson(rawJson);
  if ("error" in parsed) return { ok: false, reason: parsed.error };

  const reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning : "";

  // 1. Try deep-equal against legal list
  if (parsed.action != null) {
    const match = legalActions.find((legal) => deepEqual(legal, parsed.action));
    if (match) return { ok: true, action: match, reasoning, matchedByIndex: false };
  }

  // 2. Fallback to actionIndex
  if (typeof parsed.actionIndex === "number" && Number.isInteger(parsed.actionIndex)) {
    const idx = parsed.actionIndex;
    if (idx >= 0 && idx < legalActions.length) {
      const fallback = legalActions[idx];
      if (fallback) return { ok: true, action: fallback, reasoning, matchedByIndex: true };
    }
    return { ok: false, reason: `actionIndex ${idx} out of range [0, ${legalActions.length - 1}]` };
  }

  if (parsed.action != null) {
    return { ok: false, reason: `action ${JSON.stringify(parsed.action)} 不在合法清單內，且未提供 actionIndex` };
  }
  return { ok: false, reason: "response missing both action and actionIndex" };
}
