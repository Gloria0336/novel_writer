import { useEffect, useState, type CSSProperties } from "react";
import { useLLMAutoPlay } from "../../llm/useLLMAutoPlay";
import { isLLMConfigured } from "../../llm/llmClient";

const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";

const STORAGE_KEY_MODEL = "starfall.llm.model";

interface Props {
  /** 預設使用的 OpenRouter model id。 */
  defaultModel?: string;
  /** 顯示用：是否使用既有的 topBtn 樣式（true）或自有 inline 樣式（false）。 */
  compact?: boolean;
}

export function LLMTakeoverButton({ defaultModel = DEFAULT_MODEL, compact = false }: Props): JSX.Element {
  const [model, setModel] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MODEL) ?? defaultModel;
    } catch {
      return defaultModel;
    }
  });
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState(false);
  const llm = useLLMAutoPlay({ model });

  useEffect(() => {
    void isLLMConfigured().then(setConfigured);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MODEL, model);
    } catch {
      // ignore
    }
  }, [model]);

  if (configured === false) {
    return (
      <button
        type="button"
        className={compact ? undefined : undefined}
        style={compact ? COMPACT_STYLE : DISABLED_STYLE}
        title="尚未設定 OPENROUTER_API_KEY（請在 workspace.env 設定後重啟程式）"
        disabled
      >
        LLM 未配置
      </button>
    );
  }

  const handleToggle = (): void => {
    if (llm.active) {
      llm.stop();
    } else {
      llm.start();
    }
  };

  const label = llm.active ? "停止 LLM" : "交給 LLM 接手";

  return (
    <div style={WRAPPER_STYLE}>
      <button
        type="button"
        onClick={handleToggle}
        style={llm.active ? ACTIVE_STYLE : COMPACT_STYLE}
        title={llm.traceFilePath ? `trace: ${llm.traceFilePath}` : "點擊讓 LLM 自動操作玩家方"}
      >
        {label}
      </button>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={COMPACT_STYLE}
        title="LLM 設定 / 狀態"
      >
        ⓘ
      </button>
      {expanded && (
        <div style={PANEL_STYLE}>
          <label style={LABEL_STYLE}>
            <span>OpenRouter Model</span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={llm.active}
              style={INPUT_STYLE}
              placeholder={DEFAULT_MODEL}
            />
          </label>
          <div style={STATUS_LINE_STYLE}>
            <span>狀態：{llm.active ? "進行中" : "閒置"}</span>
            <span>步數：{llm.stepCount}</span>
          </div>
          {llm.traceFilePath && (
            <div style={MUTED_STYLE}>trace：{llm.traceFilePath}</div>
          )}
          {llm.lastError && (
            <div style={ERROR_STYLE}>錯誤：{llm.lastError}</div>
          )}
          {llm.currentThought && (
            <div style={THOUGHT_STYLE}>
              <div style={MUTED_STYLE}>最近決策（#{llm.currentThought.index}, T{llm.currentThought.turn}）</div>
              <div>{llm.currentThought.reasoning || "(無 reasoning)"}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const WRAPPER_STYLE: CSSProperties = {
  position: "relative",
  display: "inline-flex",
  gap: 6,
  alignItems: "center",
};

const COMPACT_STYLE: CSSProperties = {
  padding: "6px 10px",
  background: "linear-gradient(180deg, #2a2520, #1a1612)",
  color: "#e0c890",
  border: "1px solid #5c4a30",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "inherit",
};

const ACTIVE_STYLE: CSSProperties = {
  ...COMPACT_STYLE,
  background: "linear-gradient(180deg, #8a3a3a, #5a2020)",
  color: "#fff",
  borderColor: "#a05050",
};

const DISABLED_STYLE: CSSProperties = {
  ...COMPACT_STYLE,
  opacity: 0.5,
  cursor: "not-allowed",
};

const PANEL_STYLE: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  width: 360,
  padding: 10,
  background: "rgba(20, 16, 12, 0.95)",
  border: "1px solid #5c4a30",
  borderRadius: 6,
  zIndex: 9999,
  color: "#e8dcc0",
  fontSize: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const LABEL_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const INPUT_STYLE: CSSProperties = {
  padding: "4px 6px",
  background: "#0e0c08",
  border: "1px solid #5c4a30",
  color: "#e8dcc0",
  borderRadius: 3,
  fontFamily: "inherit",
};

const STATUS_LINE_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const MUTED_STYLE: CSSProperties = {
  color: "#9a8870",
  fontSize: 11,
  wordBreak: "break-all",
};

const ERROR_STYLE: CSSProperties = {
  color: "#ff9090",
  fontSize: 12,
  padding: "4px 6px",
  background: "rgba(80, 20, 20, 0.4)",
  borderRadius: 3,
};

const THOUGHT_STYLE: CSSProperties = {
  background: "rgba(40, 32, 20, 0.5)",
  padding: "6px 8px",
  borderRadius: 3,
  maxHeight: 160,
  overflowY: "auto",
};
