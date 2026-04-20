import { useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { yaml } from "@codemirror/lang-yaml";
import CodeMirror from "@uiw/react-codemirror";
import type { EditorView } from "@codemirror/view";
import type { DraftEntry, TweakSettings } from "../../types/app";
import { getFileExtension } from "../../utils/fileAccess";

interface EditorPaneProps {
  selectedPath?: string;
  draft?: DraftEntry;
  isLoading: boolean;
  error?: string;
  tweaks: TweakSettings;
  onChange: (value: string) => void;
  onResetToHead: () => void;
  onUpdateTweak: (patch: Partial<TweakSettings>) => void;
}

function getLanguageExtensions(path?: string) {
  const extension = getFileExtension(path ?? "");
  if (extension === "md") {
    return [markdown()];
  }
  if (extension === "yaml" || extension === "yml") {
    return [yaml()];
  }
  if (extension === "json") {
    return [json()];
  }
  return [];
}

function getEditorFontFamily(font: TweakSettings["editorFont"]) {
  if (font === "JetBrains Mono") {
    return '"JetBrains Mono", "Cascadia Mono", monospace';
  }
  if (font === "Instrument Sans") {
    return '"Instrument Sans", "Segoe UI", sans-serif';
  }
  return '"Lora", "Noto Serif TC", serif';
}

function stripBlockSyntax(line: string): string {
  return line.replace(/^\s{0,3}(?:>\s?|#{1,6}\s+)?/, "");
}

export function EditorPane(props: EditorPaneProps) {
  const { selectedPath, draft, isLoading, error, tweaks, onChange, onResetToHead, onUpdateTweak } = props;
  const editorViewRef = useRef<EditorView | null>(null);
  const extensions = useMemo(() => getLanguageExtensions(selectedPath), [selectedPath]);
  const fontFamily = useMemo(() => getEditorFontFamily(tweaks.editorFont), [tweaks.editorFont]);

  const editorStyle = {
    "--editor-font-family": fontFamily,
    "--editor-font-size": `${tweaks.editorFontSize}px`,
    "--editor-line-height": String(tweaks.editorLineHeight),
  } as CSSProperties;

  const withView = (callback: (view: EditorView) => void) => {
    const view = editorViewRef.current;
    if (!view || !draft?.isEditable) {
      return;
    }
    callback(view);
    view.focus();
  };

  const wrapSelection = (prefix: string, suffix = prefix, placeholder = "文字") => {
    withView((view) => {
      const selection = view.state.selection.main;
      const selectedText = view.state.sliceDoc(selection.from, selection.to);
      const body = selectedText || placeholder;
      const insert = `${prefix}${body}${suffix}`;
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert },
        selection: { anchor: selection.from + prefix.length, head: selection.from + prefix.length + body.length },
      });
    });
  };

  const transformSelectedLines = (transform: (line: string) => string) => {
    withView((view) => {
      const selection = view.state.selection.main;
      const startLine = view.state.doc.lineAt(selection.from);
      const endLine = view.state.doc.lineAt(selection.to);
      const text = view.state.sliceDoc(startLine.from, endLine.to);
      const updated = text
        .split("\n")
        .map((line) => transform(line))
        .join("\n");

      view.dispatch({
        changes: { from: startLine.from, to: endLine.to, insert: updated },
        selection: { anchor: startLine.from, head: startLine.from + updated.length },
      });
    });
  };

  const applyBlockFormat = (value: string) => {
    if (value === "paragraph") {
      transformSelectedLines((line) => stripBlockSyntax(line));
      return;
    }

    if (value === "quote") {
      transformSelectedLines((line) => {
        const stripped = stripBlockSyntax(line);
        return stripped.trim() ? `> ${stripped}` : "> ";
      });
      return;
    }

    const headingMatch = value.match(/^h([1-3])$/);
    if (headingMatch) {
      const depth = Number(headingMatch[1]);
      transformSelectedLines((line) => {
        const stripped = stripBlockSyntax(line);
        return stripped.trim() ? `${"#".repeat(depth)} ${stripped}` : `${"#".repeat(depth)} `;
      });
    }
  };

  if (!selectedPath) {
    return (
      <section className="editor-main">
        <div className="editor-empty">
          <div className="eyebrow">編輯器</div>
          <h2>請選擇一個檔案以開始編輯</h2>
          <p>先在左側挑選章節、設定或大綱檔案，再到這裡細修內容。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="editor-main">
      <div className="editor-toolbar">
        <span className="editor-filepath">{selectedPath}</span>
        <div className="toolbar-right">
          {draft ? (
            <span className={`draft-pill ${draft.draftContent !== draft.originalContent ? "is-dirty" : "is-clean"}`}>
              {draft.draftContent !== draft.originalContent ? "草稿已更新" : "尚未修改"}
            </span>
          ) : null}
          <button className="ghost-button" disabled={!draft || draft.draftContent === draft.originalContent} onClick={onResetToHead} type="button">
            重設
          </button>
        </div>
      </div>

      <div className="format-toolbar">
        <select
          className="format-select"
          defaultValue=""
          onChange={(event) => {
            const value = event.target.value;
            if (value) {
              applyBlockFormat(value);
              event.target.value = "";
            }
          }}
        >
          <option value="">格式</option>
          <option value="paragraph">段落</option>
          <option value="h1">標題 1</option>
          <option value="h2">標題 2</option>
          <option value="h3">標題 3</option>
          <option value="quote">引用</option>
        </select>
        <button className="format-button" onClick={() => wrapSelection("**")} type="button">
          B
        </button>
        <button className="format-button" onClick={() => wrapSelection("*")} type="button">
          I
        </button>
        <button className="format-button" onClick={() => wrapSelection("<u>", "</u>")} type="button">
          U
        </button>
        <button className="format-button" onClick={() => wrapSelection("~~")} type="button">
          S
        </button>
        <select
          className="format-select format-select-size"
          onChange={(event) => onUpdateTweak({ editorFontSize: Number(event.target.value) })}
          value={String(tweaks.editorFontSize)}
        >
          {[16, 18, 20, 22, 24].map((size) => (
            <option key={size} value={size}>
              字級 {size}
            </option>
          ))}
        </select>
      </div>

      {draft && !draft.isEditable ? <div className="panel-banner error">{draft.readOnlyReason}</div> : null}
      {error ? <div className="panel-banner error">{error}</div> : null}
      {isLoading ? <div className="panel-banner">載入檔案中...</div> : null}

      <div className="editor-surface" style={editorStyle}>
        <CodeMirror
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            foldGutter: false,
          }}
          editable={Boolean(draft?.isEditable)}
          extensions={extensions}
          height="100%"
          onChange={onChange}
          onCreateEditor={(view) => {
            editorViewRef.current = view;
          }}
          theme="light"
          value={draft?.draftContent ?? ""}
        />
      </div>
    </section>
  );
}
