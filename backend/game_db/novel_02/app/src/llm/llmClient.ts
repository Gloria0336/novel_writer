import type { LLMInferRequest, LLMInferResponse } from "./types";

export async function isLLMConfigured(): Promise<boolean> {
  if (typeof window === "undefined" || !window.llmAgent) return false;
  try {
    return await window.llmAgent.isConfigured();
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface InferWithRetryOptions {
  maxRetries?: number;
  backoffMs?: readonly number[];
}

const DEFAULT_BACKOFF = [500, 1500] as const;

/**
 * 呼叫 LLM；網路 / HTTP / 解析錯誤會自動重試。
 * 注意：validator 層的「JSON 不合法 / 動作非法」由 useLLMAutoPlay 處理，不在此層 retry。
 */
export async function inferWithRetry(
  req: LLMInferRequest,
  opts: InferWithRetryOptions = {},
): Promise<LLMInferResponse> {
  if (typeof window === "undefined" || !window.llmAgent) {
    return { ok: false, error: "window.llmAgent bridge not available" };
  }
  const max = Math.max(0, opts.maxRetries ?? 2);
  const backoff = opts.backoffMs ?? DEFAULT_BACKOFF;
  let last: LLMInferResponse = { ok: false, error: "no attempt" };
  for (let attempt = 0; attempt <= max; attempt++) {
    try {
      const res = await window.llmAgent.infer(req);
      if (res.ok) return res;
      last = res;
    } catch (err) {
      last = { ok: false, error: `bridge error: ${String(err)}` };
    }
    if (attempt < max) {
      const delay = backoff[Math.min(attempt, backoff.length - 1)] ?? 1000;
      await sleep(delay);
    }
  }
  return last;
}
