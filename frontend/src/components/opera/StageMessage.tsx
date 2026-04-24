import type { OperaMessage } from "../../types/opera";

const TYPE_LABELS: Record<string, string> = {
  dialogue: "對話",
  action: "動作",
  narration: "旁白",
  director: "導演",
  "gm-note": "GM",
};

interface StageMessageProps {
  message: OperaMessage;
}

export function StageMessage({ message }: StageMessageProps) {
  const cssType = message.type === "gm-note" ? "gm" : message.type;

  return (
    <div className={`opera-msg opera-msg-${cssType}`}>
      <div className="opera-msg-meta">
        <span className="opera-msg-speaker">{message.speakerName}</span>
        <span className="opera-msg-type-badge">{TYPE_LABELS[message.type] ?? message.type}</span>
      </div>
      <div className="opera-msg-content">
        {message.isStreaming ? (
          <span style={{ opacity: 0.5 }}>思考中…</span>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
}
