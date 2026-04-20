const EDITABLE_FILE_PATTERN = /^backend\/novel_db\/.+\.(md|ya?ml|json|txt)$/i;

export function getFileExtension(path: string): string {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index + 1).toLowerCase();
}

export function getEditableStatus(path: string): { isEditable: boolean; reason?: string } {
  if (!EDITABLE_FILE_PATTERN.test(path)) {
    return {
      isEditable: false,
      reason: "Only UTF-8 text files inside backend/novel_db with md, yaml, yml, json, or txt extensions are editable.",
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
