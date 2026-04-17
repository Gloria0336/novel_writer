const EDITABLE_FILE_PATTERN = /^backend\/novel_db\/.+\.(md|ya?ml|json|txt)$/i;

export function getFileExtension(path: string): string {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index + 1).toLowerCase();
}

export function getEditableStatus(path: string): { isEditable: boolean; reason?: string } {
  if (!EDITABLE_FILE_PATTERN.test(path)) {
    return {
      isEditable: false,
      reason: "目前只允許編輯 `backend/novel_db` 內的 md、yaml、yml、json 與 txt 檔案。",
    };
  }

  return {
    isEditable: true,
  };
}

export function tryDecodeUtf8(bytes: ArrayBuffer): string {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  return decoder.decode(bytes);
}
