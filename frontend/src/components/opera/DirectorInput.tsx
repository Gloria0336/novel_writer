import { useRef, useState } from "react";
import type { OperaCharacter, OperaMessageType } from "../../types/opera";

interface DirectorInputProps {
  characters: OperaCharacter[];
  sending: boolean;
  onSend: (content: string, type: OperaMessageType, targetCharacterId?: string) => void;
  onAutoAdvance: (characterId: string) => void;
}

const TYPE_OPTIONS: { value: OperaMessageType; label: string }[] = [
  { value: "director", label: "導演指令" },
  { value: "narration", label: "旁白" },
  { value: "dialogue", label: "代替角色說話" },
  { value: "action", label: "代替角色行動" },
];

export function DirectorInput({ characters, sending, onSend, onAutoAdvance }: DirectorInputProps) {
  const [text, setText] = useState("");
  const [type, setType] = useState<OperaMessageType>("director");
  const [targetId, setTargetId] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChars = characters.filter((c) => c.isActive);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    onSend(trimmed, type, targetId || undefined);
    setText("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const needsTarget = type === "dialogue" || type === "action";
  const resolvedTargetId = needsTarget && !targetId && activeChars[0] ? activeChars[0].id : targetId;

  return (
    <div className="opera-director-input">
      <textarea
        className="layer-editor-textarea"
        disabled={sending}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          type === "director"
            ? "輸入導演指令（事件、轉折、場景變化）…按 Ctrl+Enter 發送"
            : type === "narration"
            ? "輸入旁白說明…"
            : "輸入角色的對話或動作內容…"
        }
        ref={textareaRef}
        rows={3}
        value={text}
      />

      <div className="opera-director-controls">
        <select
          className="opera-type-select"
          onChange={(e) => setType(e.target.value as OperaMessageType)}
          value={type}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {needsTarget && (
          <select
            className="opera-char-select"
            onChange={(e) => setTargetId(e.target.value)}
            value={resolvedTargetId}
          >
            {activeChars.length === 0 ? (
              <option value="">（無在場角色）</option>
            ) : (
              activeChars.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            )}
          </select>
        )}

        <button
          className="solid-button"
          disabled={!text.trim() || sending}
          onClick={handleSend}
          style={{ marginLeft: "auto" }}
          type="button"
        >
          {sending ? "處理中…" : "發送"}
        </button>

        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {activeChars.map((c) => (
            <button
              className="ghost-button"
              disabled={sending}
              key={c.id}
              onClick={() => onAutoAdvance(c.id)}
              style={{ fontSize: "0.78rem", padding: "4px 10px" }}
              title={`觸發 ${c.name} 的 AI 回應`}
              type="button"
            >
              ▶ {c.name}
            </button>
          ))}
        </div>
      </div>

      {sending && (
        <p className="opera-sending-indicator">AI 代理人思考中，請稍候…</p>
      )}
    </div>
  );
}
