import type { AiChatResponse, DraftEntry, OpenRouterChatRequest, WorkspaceConfig, WorkspaceMessage } from "../types/app";

function buildContextBlock(draft: DraftEntry): string {
  return [`Path: ${draft.path}`, "```", draft.draftContent, "```"].join("\n");
}

export function buildWorkspaceRequest(params: {
  workspace: WorkspaceConfig;
  history: WorkspaceMessage[];
  prompt: string;
  attachedDrafts: DraftEntry[];
  repoStructure?: string;
  targetPath?: string;
}): OpenRouterChatRequest {
  const { workspace, history, prompt, attachedDrafts, repoStructure, targetPath } = params;
  const contextBlocks = attachedDrafts.map(buildContextBlock);

  const messages: OpenRouterChatRequest["messages"] = [];

  if (workspace.systemPrompt.trim()) {
    messages.push({
      role: "system",
      content: workspace.systemPrompt.trim(),
    });
  }

  if (repoStructure?.trim()) {
    messages.push({
      role: "system",
      content: `Relevant novel structure:\n\n${repoStructure.trim()}`,
    });
  }

  if (contextBlocks.length > 0) {
    messages.push({
      role: "system",
      content: `Attached file context:\n\n${contextBlocks.join("\n\n")}`,
    });
  }

  messages.push({
    role: "system",
    content: [
      targetPath ? `The target file being edited is: ${targetPath}` : "No target file was provided.",
      "Return valid JSON with this exact shape:",
      '{"assistantText":"short explanation for the user","proposedContent":"full rewritten file or null"}',
      "If you are rewriting the target file, proposedContent must contain the complete file content.",
      "Do not wrap the JSON in Markdown fences.",
    ].join("\n\n"),
  });

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

export function parseAiResponseEnvelope(text: string, targetPath?: string): AiChatResponse {
  try {
    const parsed = JSON.parse(text) as {
      assistantText?: unknown;
      proposedContent?: unknown;
    };

    return {
      assistantText:
        typeof parsed.assistantText === "string" && parsed.assistantText.trim().length > 0 ? parsed.assistantText : text,
      proposedContent: typeof parsed.proposedContent === "string" ? parsed.proposedContent : undefined,
      targetPath,
    };
  } catch {
    return {
      assistantText: text,
      targetPath,
    };
  }
}
