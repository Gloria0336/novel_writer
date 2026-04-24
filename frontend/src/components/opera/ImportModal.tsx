import { useState } from "react";
import type { BridgeClient } from "../../services/bridgeClient";
import type { ModelInfo, RepoConfig, RepoTreeEntry } from "../../types/app";
import type { OperaCharacter } from "../../types/opera";
import { findNovelIds, importNovelCharacters } from "../../utils/novelImport";

interface ImportModalProps {
  isOpen: boolean;
  entries: RepoTreeEntry[];
  bridgeClient: BridgeClient;
  repoConfig: RepoConfig;
  models: ModelInfo[];
  defaultModel: string;
  onImport: (result: {
    characters: OperaCharacter[];
    worldKnowledge: string;
    storyState: string;
  }) => void;
  onClose: () => void;
}

export function ImportModal({
  isOpen,
  entries,
  bridgeClient,
  repoConfig,
  models,
  defaultModel,
  onImport,
  onClose,
}: ImportModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    novelId: string;
    characters: OperaCharacter[];
    worldKnowledge: string;
    storyState: string;
  } | null>(null);

  if (!isOpen) return null;

  const novelIds = findNovelIds(entries);

  const handleLoad = async (novelId: string) => {
    setLoading(novelId);
    setError("");
    setPreview(null);
    try {
      const result = await importNovelCharacters({
        novelId,
        entries,
        bridgeClient,
        repoConfig,
        defaultModel,
      });
      setPreview({
        novelId,
        characters: result.characters,
        worldKnowledge: result.suggestedWorldKnowledge,
        storyState: result.suggestedStoryState,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoading(null);
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    onImport({
      characters: preview.characters,
      worldKnowledge: preview.worldKnowledge,
      storyState: preview.storyState,
    });
    setPreview(null);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog">
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 540 }}
      >
        <div className="modal-header">
          <h2 className="modal-title">從小說匯入角色</h2>
          <button
            aria-label="關閉"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
              <path
                d="M1 1l10 10M11 1L1 11"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.4"
              />
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ padding: "0 24px 24px" }}>
          {error && <div className="screen-banner error" style={{ margin: "12px 0" }}>{error}</div>}

          {novelIds.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
              在 backend/novel_db/ 中未找到任何小說。
            </p>
          ) : (
            <div className="opera-import-novel-list">
              {novelIds.map((novelId) => (
                <div className="opera-import-novel-row" key={novelId}>
                  <span className="opera-import-novel-name">{novelId}</span>
                  <button
                    className="ghost-button"
                    disabled={loading === novelId}
                    onClick={() => void handleLoad(novelId)}
                    type="button"
                  >
                    {loading === novelId ? "載入中..." : "預覽"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {preview && (
            <>
              <div className="opera-import-preview" style={{ marginTop: 18 }}>
                <p className="opera-import-preview-title">
                  {preview.novelId} — 找到 {preview.characters.length} 個角色
                </p>
                {preview.characters.map((c) => (
                  <div className="opera-import-char-row" key={c.id}>
                    <span className="opera-import-char-name">{c.name}</span>
                    <span className="opera-import-char-role">{c.role}</span>
                  </div>
                ))}
              </div>

              {preview.worldKnowledge && (
                <p style={{ marginTop: 12, fontSize: "0.82rem", color: "var(--muted)" }}>
                  ✓ 已偵測到 CONTEXT.md，將自動填入 L1 世界知識與 L2 故事狀態。
                </p>
              )}

              <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  className="ghost-button"
                  onClick={() => setPreview(null)}
                  type="button"
                >
                  取消
                </button>
                <button
                  className="solid-button"
                  onClick={handleConfirm}
                  type="button"
                >
                  匯入 {preview.characters.length} 個角色
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
