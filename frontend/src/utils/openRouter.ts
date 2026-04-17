import type { DraftEntry, OpenRouterChatRequest, WorkspaceConfig, WorkspaceMessage } from "../types/app";

export function buildWorkspaceRequest(params: {
  workspace: WorkspaceConfig;
  history: WorkspaceMessage[];
  prompt: string;
  attachedDrafts: DraftEntry[];
}): OpenRouterChatRequest {
  const { workspace, history, prompt, attachedDrafts } = params;

  const contextBlocks = attachedDrafts.map((draft) => {
    return `檔案：${draft.path}\n\`\`\`\n${draft.draftContent}\n\`\`\``;
  });

  const messages: OpenRouterChatRequest["messages"] = [];

  if (workspace.systemPrompt.trim()) {
    messages.push({
      role: "system",
      content: workspace.systemPrompt.trim(),
    });
  }

  if (contextBlocks.length > 0) {
    messages.push({
      role: "system",
      content: `以下是目前附加給你的文檔內容。請優先根據這些資料回答，避免憑空補設定。\n\n${contextBlocks.join("\n\n")}`,
    });
  }

  for (const item of history) {
    messages.push({
      role: item.role,
      content: item.content,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  return {
    model: workspace.model,
    messages,
    temperature: workspace.temperature,
    maxCompletionTokens: workspace.maxCompletionTokens,
  };
}
