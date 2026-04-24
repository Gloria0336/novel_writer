import type { OperaCharacter } from "../../types/opera";

interface CharacterCardProps {
  character: OperaCharacter;
  isInScene: boolean;
  onToggleInScene: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

export function CharacterCard({
  character,
  isInScene,
  onToggleInScene,
  onEdit,
  onRemove,
}: CharacterCardProps) {
  const initials = character.avatarInitials ?? character.name.slice(0, 2);
  const shortModel = character.model.split("/").pop() ?? character.model;

  return (
    <div
      className={`opera-char-card${isInScene ? " is-active-in-scene" : ""}${
        !character.isActive ? " is-inactive" : ""
      }`}
    >
      <div className="opera-char-row">
        <div className={`opera-char-avatar${!character.isActive ? " is-inactive" : ""}`}>
          {initials}
        </div>
        <div className="opera-char-info">
          <div className="opera-char-name">{character.name}</div>
          {character.role && <div className="opera-char-role">{character.role}</div>}
        </div>
        <div className="opera-char-actions">
          <button
            aria-label="編輯角色"
            className="icon-button"
            onClick={onEdit}
            title="編輯角色"
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
          <button
            aria-label="移除角色"
            className="icon-button"
            onClick={onRemove}
            title="移除角色"
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
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span className="opera-char-model-chip" title={character.model}>
          {shortModel}
        </span>
        <label
          style={{
            fontSize: "0.78rem",
            display: "flex",
            alignItems: "center",
            gap: 5,
            cursor: "pointer",
            color: "var(--muted)",
          }}
        >
          <input
            checked={isInScene}
            onChange={onToggleInScene}
            type="checkbox"
          />
          在場
        </label>
      </div>
    </div>
  );
}
