import type { TweakSettings } from "../../types/app";

interface TweaksPanelProps {
  tweaks: TweakSettings;
  visible: boolean;
  onChange: (patch: Partial<TweakSettings>) => void;
}

export function TweaksPanel(props: TweaksPanelProps) {
  const { tweaks, visible, onChange } = props;

  return (
    <aside className={`tweaks-panel ${visible ? "is-visible" : ""}`}>
      <div className="tweaks-header">
        <div>
          <div className="eyebrow">外觀調整</div>
          <h3>閱讀與編輯手感</h3>
        </div>
      </div>

      <div className="tweaks-body">
        <label className="tweak-field">
          <span>介面字型</span>
          <select
            className="select-input"
            onChange={(event) => onChange({ uiFont: event.target.value as TweakSettings["uiFont"] })}
            value={tweaks.uiFont}
          >
            <option value="Instrument Sans">Instrument Sans</option>
            <option value="Lora">Lora</option>
            <option value="JetBrains Mono">JetBrains Mono</option>
          </select>
        </label>

        <label className="tweak-field">
          <span>編輯器字型</span>
          <select
            className="select-input"
            onChange={(event) => onChange({ editorFont: event.target.value as TweakSettings["editorFont"] })}
            value={tweaks.editorFont}
          >
            <option value="Lora">Lora</option>
            <option value="Instrument Sans">Instrument Sans</option>
            <option value="JetBrains Mono">JetBrains Mono</option>
          </select>
        </label>

        <label className="tweak-field">
          <span>編輯器字級 — {tweaks.editorFontSize}px</span>
          <input
            className="slider-input"
            max={28}
            min={14}
            onChange={(event) => onChange({ editorFontSize: Number(event.target.value) })}
            step={1}
            type="range"
            value={tweaks.editorFontSize}
          />
        </label>

        <label className="tweak-field">
          <span>編輯器行高 — {tweaks.editorLineHeight.toFixed(2)}</span>
          <input
            className="slider-input"
            max={2.4}
            min={1.3}
            onChange={(event) => onChange({ editorLineHeight: Number(event.target.value) })}
            step={0.05}
            type="range"
            value={tweaks.editorLineHeight}
          />
        </label>

        <label className="tweak-field">
          <span>介面字級 — {tweaks.fontSize}px</span>
          <input
            className="slider-input"
            max={20}
            min={14}
            onChange={(event) => onChange({ fontSize: Number(event.target.value) })}
            step={1}
            type="range"
            value={tweaks.fontSize}
          />
        </label>
      </div>
    </aside>
  );
}
