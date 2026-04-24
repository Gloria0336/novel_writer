import { useState } from "react";
import type { ModelInfo } from "../../types/app";
import type { OperaCharacter } from "../../types/opera";
import { CharacterCard } from "./CharacterCard";
import { CharacterEditor } from "./CharacterEditor";

interface CharacterRosterProps {
  characters: OperaCharacter[];
  activeCharacterIds: string[];
  models: ModelInfo[];
  onToggleInScene: (characterId: string) => void;
  onUpdateCharacter: (characterId: string, patch: Partial<OperaCharacter>) => void;
  onRemoveCharacter: (characterId: string) => void;
  onAddCharacter: () => void;
  onOpenImport: () => void;
}

export function CharacterRoster({
  characters,
  activeCharacterIds,
  models,
  onToggleInScene,
  onUpdateCharacter,
  onRemoveCharacter,
  onAddCharacter,
  onOpenImport,
}: CharacterRosterProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingChar = editingId ? characters.find((c) => c.id === editingId) : null;

  return (
    <>
      <div className="opera-panel">
        <div className="opera-panel-header">
          <span className="opera-panel-title">角色名單</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="ghost-button"
              onClick={onOpenImport}
              style={{ fontSize: "0.78rem", padding: "3px 10px" }}
              title="從小說匯入角色"
              type="button"
            >
              匯入
            </button>
            <button
              className="ghost-button"
              onClick={onAddCharacter}
              style={{ fontSize: "0.78rem", padding: "3px 10px" }}
              title="新增空白角色"
              type="button"
            >
              + 新增
            </button>
          </div>
        </div>

        <div className="opera-panel-scroll">
          {characters.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "0.86rem", textAlign: "center", padding: "20px 0" }}>
              尚無角色。<br />點擊「匯入」或「＋新增」開始。
            </p>
          ) : (
            <div className="opera-roster-list">
              {characters.map((char) => (
                <CharacterCard
                  character={char}
                  isInScene={activeCharacterIds.includes(char.id)}
                  key={char.id}
                  onEdit={() => setEditingId(char.id)}
                  onRemove={() => onRemoveCharacter(char.id)}
                  onToggleInScene={() => onToggleInScene(char.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {editingChar && (
        <CharacterEditor
          character={editingChar}
          models={models}
          onClose={() => setEditingId(null)}
          onSave={(patch) => onUpdateCharacter(editingChar.id, patch)}
        />
      )}
    </>
  );
}
