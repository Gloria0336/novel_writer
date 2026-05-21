import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBattle } from "../game/BattleProvider";
import { createBattleContext } from "../game/seed";
import { enumeratePlayerActions, describeAction } from "./playerEnumerate";
import { buildPrompt } from "./promptBuilder";
import { validateAction } from "./actionValidator";
import { inferWithRetry } from "./llmClient";
import type { GameAction } from "../core/turn/actions";
import type { LLMThoughtEntry, LLMTraceFinalResult } from "./types";

export interface UseLLMAutoPlayOptions {
  model: string;
  /** 每次 LLM 呼叫失敗（JSON 解析或動作非法）後的修正重試次數。 */
  validationRetries?: number;
  /** 每次成功 dispatch 後到下一次 LLM 呼叫前的延遲（毫秒）。 */
  thinkingDelayMs?: number;
  /** 單次 LLM HTTP 呼叫的網路 retry 次數。 */
  networkRetries?: number;
  /** 安全上限：超過後自動 END_TURN 終止。 */
  maxStepsPerActivation?: number;
}

export interface UseLLMAutoPlayResult {
  active: boolean;
  start: () => void;
  stop: () => void;
  lastError: string | null;
  currentThought: LLMThoughtEntry | null;
  stepCount: number;
  traceFilePath: string | null;
}

const DEFAULT_VALIDATION_RETRIES = 2;
const DEFAULT_THINKING_DELAY_MS = 250;
const DEFAULT_MAX_STEPS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function resultToFinal(result: string | undefined): LLMTraceFinalResult | undefined {
  if (result === "playerWin" || result === "playerLose") return result;
  return undefined;
}

export function useLLMAutoPlay(opts: UseLLMAutoPlayOptions): UseLLMAutoPlayResult {
  const battle = useBattle();
  const ctx = useMemo(() => createBattleContext(), []);

  const [active, setActive] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [currentThought, setCurrentThought] = useState<LLMThoughtEntry | null>(null);
  const [stepCount, setStepCount] = useState(0);
  const [traceFilePath, setTraceFilePath] = useState<string | null>(null);

  const activeRef = useRef(active);
  activeRef.current = active;
  const stepCountRef = useRef(0);
  const indexRef = useRef(0);
  const tracingRef = useRef(false);
  const settleResolversRef = useRef<Array<() => void>>([]);
  const isAnimatingRef = useRef(battle.isAnimating);
  const wasAnimatingRef = useRef(battle.isAnimating);
  const finalizedRef = useRef(false);

  // 監看 isAnimating 跳變：true → false 時解開所有等待 settle 的 promise
  useEffect(() => {
    isAnimatingRef.current = battle.isAnimating;
    if (wasAnimatingRef.current && !battle.isAnimating) {
      const resolvers = settleResolversRef.current;
      settleResolversRef.current = [];
      for (const r of resolvers) r();
    }
    wasAnimatingRef.current = battle.isAnimating;
  }, [battle.isAnimating]);

  const waitUntilSettled = useCallback((): Promise<void> => {
    if (!isAnimatingRef.current) return Promise.resolve();
    return new Promise<void>((resolve) => {
      settleResolversRef.current.push(resolve);
    });
  }, []);

  const ensureTraceStarted = useCallback(async (): Promise<string | null> => {
    if (tracingRef.current) return traceFilePath;
    const bridge = typeof window !== "undefined" ? window.llmTrace : undefined;
    if (!bridge) return null;
    try {
      const res = await bridge.start({
        sessionId: battle.meta.sessionId,
        model: opts.model,
        filenameMeta: battle.meta.filenameMeta,
      });
      tracingRef.current = true;
      setTraceFilePath(res.filePath);
      return res.filePath;
    } catch (err) {
      console.error("[llm] failed to start trace", err);
      return null;
    }
  }, [battle.meta, opts.model, traceFilePath]);

  const appendThought = useCallback(async (entry: LLMThoughtEntry) => {
    const bridge = typeof window !== "undefined" ? window.llmTrace : undefined;
    if (!bridge) return;
    try {
      await bridge.append(battle.meta.sessionId, entry);
    } catch (err) {
      console.error("[llm] failed to append thought", err);
    }
  }, [battle.meta.sessionId]);

  const finishTrace = useCallback(async (reason: string, finalResult?: LLMTraceFinalResult) => {
    if (!tracingRef.current || finalizedRef.current) return;
    finalizedRef.current = true;
    const bridge = typeof window !== "undefined" ? window.llmTrace : undefined;
    if (!bridge) return;
    try {
      await bridge.finish(battle.meta.sessionId, reason, finalResult);
    } catch (err) {
      console.error("[llm] failed to finish trace", err);
    }
  }, [battle.meta.sessionId]);

  const pickActionWithLLM = useCallback(async (
    legalActions: GameAction[],
    turn: number,
  ): Promise<{ ok: true; action: GameAction; thought: LLMThoughtEntry } | { ok: false; reason: string; thought: LLMThoughtEntry }> => {
    const validationRetries = Math.max(0, opts.validationRetries ?? DEFAULT_VALIDATION_RETRIES);
    let correction: string | undefined;

    for (let attempt = 0; attempt <= validationRetries; attempt++) {
      const prompt = buildPrompt(battle.actionState, ctx, legalActions, correction);
      const inferRes = await inferWithRetry(
        { model: opts.model, system: prompt.system, user: prompt.user, maxTokens: 1500, temperature: 0.7 },
        { maxRetries: opts.networkRetries ?? 2 },
      );

      indexRef.current += 1;
      const baseEntry: LLMThoughtEntry = {
        turn,
        index: indexRef.current,
        timestamp: new Date().toISOString(),
        model: opts.model,
        legalActionCount: legalActions.length,
        promptTokens: inferRes.usage?.prompt,
        completionTokens: inferRes.usage?.completion,
        reasoning: "",
        chosenAction: { type: "END_TURN" },
        retryOf: attempt > 0 ? indexRef.current - attempt : undefined,
      };

      if (!inferRes.ok) {
        const entry: LLMThoughtEntry = { ...baseEntry, reasoning: "(LLM request failed)", validationError: inferRes.error };
        return { ok: false, reason: inferRes.error ?? "LLM request failed", thought: entry };
      }

      const validated = validateAction(inferRes.jsonText ?? "", legalActions);
      if (validated.ok) {
        const entry: LLMThoughtEntry = {
          ...baseEntry,
          reasoning: validated.reasoning,
          chosenAction: validated.action,
        };
        return { ok: true, action: validated.action, thought: entry };
      }

      // 驗證失敗 → 記錄並準備 correction
      const failedEntry: LLMThoughtEntry = {
        ...baseEntry,
        reasoning: "(invalid response)",
        validationError: validated.reason,
        rawResponse: inferRes.jsonText,
      };
      await appendThought(failedEntry);
      setCurrentThought(failedEntry);
      correction = `${validated.reason}。請從合法動作清單中重新挑選，回傳嚴格 JSON。`;
    }

    // 全部 retry 用盡：兜底 END_TURN
    const endTurnAction: GameAction = { type: "END_TURN" };
    const fallbackEntry: LLMThoughtEntry = {
      turn,
      index: ++indexRef.current,
      timestamp: new Date().toISOString(),
      model: opts.model,
      legalActionCount: legalActions.length,
      reasoning: "(validation retries exhausted, fell back to END_TURN)",
      chosenAction: endTurnAction,
      validationError: "validation retries exhausted",
    };
    return { ok: true, action: endTurnAction, thought: fallbackEntry };
  }, [battle.actionState, ctx, opts.model, opts.networkRetries, opts.validationRetries, appendThought]);

  // 主迴圈：當 active && canAct 時，跑一步、等動畫、再回到 effect 重跑
  useEffect(() => {
    if (!active) return;
    if (!battle.canAct) return;
    if (battle.state.result !== "ongoing") return;
    if (stepCountRef.current >= (opts.maxStepsPerActivation ?? DEFAULT_MAX_STEPS)) {
      setActive(false);
      setLastError(`已達單次啟動最大步數 ${opts.maxStepsPerActivation ?? DEFAULT_MAX_STEPS}，自動停止`);
      return;
    }

    let cancelled = false;

    (async () => {
      const filePath = await ensureTraceStarted();
      if (filePath === null && tracingRef.current === false) {
        if (typeof window === "undefined" || !window.llmTrace) {
          setActive(false);
          setLastError("window.llmTrace 不可用（請確認 preload 正常）");
          return;
        }
      }

      if (cancelled || !activeRef.current) return;

      const legal = enumeratePlayerActions(battle.actionState, ctx);
      const turn = battle.actionState.turn;
      const picked = await pickActionWithLLM(legal, turn);

      if (cancelled || !activeRef.current) return;

      await appendThought(picked.thought);
      setCurrentThought(picked.thought);

      if (!picked.ok) {
        setLastError(picked.reason);
        setActive(false);
        return;
      }

      stepCountRef.current += 1;
      setStepCount(stepCountRef.current);
      const actionDescription = describeAction(picked.action, battle.actionState, ctx);
      console.log(`[llm] step ${stepCountRef.current}: ${actionDescription}`);

      battle.dispatch(picked.action);

      await waitUntilSettled();
      if (cancelled) return;
      await sleep(opts.thinkingDelayMs ?? DEFAULT_THINKING_DELAY_MS);
      // effect 會因 battle.state/canAct 變更而重跑下一輪
    })();

    return () => {
      cancelled = true;
    };
  }, [active, battle.canAct, battle.state, battle.actionState, battle.dispatch, ctx, ensureTraceStarted, pickActionWithLLM, appendThought, waitUntilSettled, opts.maxStepsPerActivation, opts.thinkingDelayMs]);

  // 結束時收尾 trace
  useEffect(() => {
    if (battle.state.result === "ongoing") return;
    if (!tracingRef.current || finalizedRef.current) return;
    const finalResult = resultToFinal(battle.state.result);
    void finishTrace("battle ended", finalResult);
    setActive(false);
  }, [battle.state.result, finishTrace]);

  // 元件卸載：若仍在記錄，標記為 abandoned
  useEffect(() => {
    return () => {
      if (tracingRef.current && !finalizedRef.current) {
        void finishTrace("hook unmounted", "abandoned");
      }
    };
  }, [finishTrace]);

  const start = useCallback(() => {
    setLastError(null);
    stepCountRef.current = 0;
    setStepCount(0);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
  }, []);

  return { active, start, stop, lastError, currentThought, stepCount, traceFilePath };
}
