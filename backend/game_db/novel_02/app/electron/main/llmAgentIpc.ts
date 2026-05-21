import { ipcMain } from "electron";
import { request } from "node:https";
import { URL } from "node:url";
import {
  getOpenRouterBaseUrl,
  getOpenRouterKey,
  getOpenRouterSiteName,
  getOpenRouterSiteUrl,
} from "./envLoader";
import type { LLMInferRequest, LLMInferResponse } from "../../src/llm/types";

const CHANNELS = {
  infer: "llm-agent:infer",
  isConfigured: "llm-agent:isConfigured",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertInferRequest(value: unknown): asserts value is LLMInferRequest {
  if (!isRecord(value)) throw new Error("Invalid LLM infer request");
  if (typeof value["model"] !== "string" || !value["model"]) throw new Error("Missing model");
  if (typeof value["system"] !== "string") throw new Error("Missing system prompt");
  if (typeof value["user"] !== "string") throw new Error("Missing user prompt");
}

async function callOpenRouter(req: LLMInferRequest): Promise<LLMInferResponse> {
  const key = getOpenRouterKey();
  if (!key) return { ok: false, error: "OPENROUTER_API_KEY not configured in workspace.env" };

  const baseUrl = getOpenRouterBaseUrl().replace(/\/+$/, "");
  const url = new URL(`${baseUrl}/chat/completions`);

  const body = JSON.stringify({
    model: req.model,
    messages: [
      { role: "system", content: req.system },
      { role: "user", content: req.user },
    ],
    max_tokens: req.maxTokens ?? 1500,
    temperature: req.temperature ?? 0.7,
    response_format: { type: "json_object" },
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body).toString(),
    Authorization: `Bearer ${key}`,
  };
  const siteUrl = getOpenRouterSiteUrl();
  if (siteUrl) headers["HTTP-Referer"] = siteUrl;
  const siteName = getOpenRouterSiteName();
  if (siteName) headers["X-Title"] = siteName;

  return new Promise<LLMInferResponse>((resolvePromise) => {
    const req2 = request(
      {
        method: "POST",
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          const status = res.statusCode ?? 0;
          if (status < 200 || status >= 300) {
            resolvePromise({ ok: false, error: `OpenRouter HTTP ${status}: ${text.slice(0, 500)}` });
            return;
          }
          try {
            const parsed = JSON.parse(text) as {
              choices?: Array<{ message?: { content?: string } }>;
              usage?: { prompt_tokens?: number; completion_tokens?: number };
              error?: { message?: string };
            };
            if (parsed.error?.message) {
              resolvePromise({ ok: false, error: `OpenRouter error: ${parsed.error.message}` });
              return;
            }
            const content = parsed.choices?.[0]?.message?.content;
            if (typeof content !== "string") {
              resolvePromise({ ok: false, error: "No content in OpenRouter response" });
              return;
            }
            const usage = parsed.usage
              ? { prompt: parsed.usage.prompt_tokens ?? 0, completion: parsed.usage.completion_tokens ?? 0 }
              : undefined;
            resolvePromise({ ok: true, jsonText: content, usage });
          } catch (err) {
            resolvePromise({ ok: false, error: `Parse error: ${String(err)}` });
          }
        });
      },
    );
    req2.on("error", (err) => {
      resolvePromise({ ok: false, error: `Network error: ${err.message}` });
    });
    req2.setTimeout(60_000, () => {
      req2.destroy(new Error("LLM request timeout (60s)"));
    });
    req2.write(body);
    req2.end();
  });
}

export function registerLLMAgentIpc(): void {
  ipcMain.handle(CHANNELS.infer, async (_event, req: unknown) => {
    assertInferRequest(req);
    return callOpenRouter(req);
  });
  ipcMain.handle(CHANNELS.isConfigured, () => {
    return Boolean(getOpenRouterKey());
  });
}
