import { useEffect, useMemo, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { yaml } from "@codemirror/lang-yaml";
import { json } from "@codemirror/lang-json";
import type { EditorView } from "@codemirror/view";
import type { DraftEntry } from "../../types/app";
import { getFileExtension } from "../../utils/fileAccess";

export interface EditorHandle {
  insertText: (text: string) => void;
  replaceSelection: (text: string) => void;
  replaceAll: (text: string) => void;
}

interface EditorPaneProps {
  selectedPath?: string;
  draft?: DraftEntry;
  isLoading: boolean;
  error?: string;
  onChange: (value: string) => void;
  onResetToHead: () => void;
  onReady: (handle: EditorHandle | null) => void;
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

export function EditorPane(props: EditorPaneProps) {
  const { selectedPath, draft, isLoading, error, onChange, onResetToHead, onReady } = props;
  const editorViewRef = useRef<EditorView | null>(null);
  const extensions = useMemo(() => getLanguageExtensions(selectedPath), [selectedPath]);

  useEffect(() => () => onReady(null), [onReady]);

  if (!selectedPath) {
    return (
      <div className="editor-empty">
        <div className="eyebrow">Editor</div>
        <h2>Select a file from the repo tree</h2>
        <p>你可以瀏覽整個 repo，但只有 `backend/novel_db` 內的指定文字檔可編輯。</p>
      </div>
    );
  }

  return (
    <div className="editor-pane">
      <div className="editor-header">
        <div>
          <div className="eyebrow">Editor</div>
          <h2>{selectedPath}</h2>
        </div>
        <div className="inline-row">
          {draft ? <span className={`status-pill ${draft.draftContent !== draft.originalContent ? "status-live" : "status-muted"}`}>{draft.draftContent !== draft.originalContent ? "dirty" : "synced"}</span> : null}
          <button className="ghost-button" disabled={!draft} onClick={onResetToHead} type="button">
            Reset to HEAD
          </button>
        </div>
      </div>

      {draft && !draft.isEditable ? <div className="panel-banner muted">{draft.readOnlyReason}</div> : null}
      {error ? <div className="panel-banner error">{error}</div> : null}
      {isLoading ? <div className="panel-banner">Loading file...</div> : null}

      <div className="editor-surface">
        <CodeMirror
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            foldGutter: true,
          }}
          editable={Boolean(draft?.isEditable)}
          extensions={extensions}
          height="100%"
          onChange={onChange}
          onCreateEditor={(view) => {
            editorViewRef.current = view;
            onReady({
              insertText: (text) => {
                const editor = editorViewRef.current;
                if (!editor) {
                  return;
                }
                editor.dispatch(editor.state.replaceSelection(text));
                editor.focus();
              },
              replaceSelection: (text) => {
                const editor = editorViewRef.current;
                if (!editor) {
                  return;
                }
                editor.dispatch(editor.state.replaceSelection(text));
                editor.focus();
              },
              replaceAll: (text) => {
                const editor = editorViewRef.current;
                if (!editor) {
                  return;
                }
                editor.dispatch({
                  changes: {
                    from: 0,
                    to: editor.state.doc.length,
                    insert: text,
                  },
                });
                editor.focus();
              },
            });
          }}
          theme="dark"
          value={draft?.draftContent ?? ""}
        />
      </div>
    </div>
  );
}
