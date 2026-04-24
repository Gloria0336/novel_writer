interface LayerEditorProps {
  label: string;
  badge?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  locked?: boolean;
  rows?: number;
  placeholder?: string;
}

export function LayerEditor({
  label,
  badge,
  hint,
  value,
  onChange,
  locked = false,
  rows = 4,
  placeholder,
}: LayerEditorProps) {
  return (
    <div className={`layer-editor${locked ? " layer-l4" : ""}`}>
      <div className="layer-editor-header">
        <span className="layer-editor-label">{label}</span>
        {badge && (
          <span className={`layer-editor-badge${locked ? " is-locked" : ""}`}>
            {locked ? "🔒 " : ""}
            {badge}
          </span>
        )}
      </div>
      {hint && <p className="layer-editor-hint">{hint}</p>}
      <textarea
        className="layer-editor-textarea"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
    </div>
  );
}
