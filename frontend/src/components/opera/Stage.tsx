import { useEffect, useRef } from "react";
import type { OperaCharacter, OperaMessage, OperaMessageType, OperaScene } from "../../types/opera";
import { DirectorInput } from "./DirectorInput";
import { StageMessage } from "./StageMessage";

interface StageProps {
  scene: OperaScene;
  messages: OperaMessage[];
  characters: OperaCharacter[];
  sending: boolean;
  onDirectorSend: (content: string, type: OperaMessageType, targetCharacterId?: string) => void;
  onAutoAdvance: (characterId: string) => void;
  onEditScene: () => void;
}

export function Stage({
  scene,
  messages,
  characters,
  sending,
  onDirectorSend,
  onAutoAdvance,
  onEditScene,
}: StageProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sceneChars = characters.filter((c) => scene.activeCharacterIds.includes(c.id));

  return (
    <div className="opera-stage">
      <div className="opera-stage-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div className="opera-stage-title">{scene.title || "（無標題場景）"}</div>
            {scene.description && (
              <div className="opera-stage-desc">{scene.description}</div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {sceneChars.length > 0 && (
              <div style={{ display: "flex", gap: 4 }}>
                {sceneChars.map((c) => (
                  <span
                    key={c.id}
                    style={{
                      fontSize: "0.76rem",
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "var(--accent-soft)",
                      border: "1px solid rgba(168,100,56,0.22)",
                      color: "var(--accent-strong)",
                    }}
                    title={c.role}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}
            <button
              aria-label="編輯場景"
              className="icon-button"
              onClick={onEditScene}
              title="編輯場景標題與說明"
              type="button"
            >
              <svg fill="none" height="12" viewBox="0 0 14 14" width="12">
                <path
                  d="M2 10L10.5 1.5a1.5 1.5 0 0 1 2.1 2.1L4 12H2v-2z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.3"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="opera-message-list">
        {messages.length === 0 ? (
          <div className="opera-message-list-empty">
            舞台靜默中。<br />從右側設定場景，或在下方輸入導演指令開始演出。
          </div>
        ) : (
          messages.map((msg) => (
            <StageMessage key={msg.id} message={msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <DirectorInput
        characters={characters.filter((c) => scene.activeCharacterIds.includes(c.id))}
        onAutoAdvance={onAutoAdvance}
        onSend={onDirectorSend}
        sending={sending}
      />
    </div>
  );
}
