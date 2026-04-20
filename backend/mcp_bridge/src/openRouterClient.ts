import { OPENROUTER_API_KEY, OPENROUTER_REFERER, OPENROUTER_TITLE } from "./config.js";
import type { AiChatRequest, AiChatResponse, DraftEntry, WorkspaceMessage } from "./types.js";

interface ModelResponseItem {
  id?: string;
  name?: string;
  description?: string;
  context_length?: number;
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
  };
  supported_parameters?: string[];
}

interface ModelsResponse {
  data?: ModelResponseItem[];
}

interface ChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export interface ModelInfo {
  id: string;
  name: string;
  contextLength: number;
  description?: string;
  inputModalities: string[];
  outputModalities: string[];
  supportedParameters: string[];
}

function buildHeaders(): HeadersInit {
  if (!OPENROUTER_API_KEY) {
    throw new Error("NOVEL_WRITER_OPENROUTER_API_KEY is not configured for the bridge.");
  }

  return {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": OPENROUTER_REFERER,
    "X-OpenRouter-Title": OPENROUTER_TITLE,
  };
}

async function parseError(response: Response): Promise<Error> {
  const body = await response.text();
  return new Error(body || `OpenRouter request failed with ${response.status}.`);
}

function normalizeModalities(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeModel(item: ModelResponseItem): ModelInfo | null {
  if (typeof item.id !== "string" || item.id.trim().length === 0) {
    return null;
  }

  const inputModalities = normalizeModalities(item.architecture?.input_modalities);
  const outputModalities = normalizeModalities(item.architecture?.output_modalities);
  const supportedParameters = normalizeModalities(item.supported_parameters);

  if (outputModalities.length > 0 && !outputModalities.includes("text")) {
    return null;
  }

  return {
    id: item.id,
    name: typeof item.name === "string" && item.name.trim().length > 0 ? item.name : item.id,
    description: typeof item.description === "string" ? item.description : undefined,
    contextLength: typeof item.context_length === "number" ? item.context_length : 0,
    inputModalities,
    outputModalities,
    supportedParameters,
  };
}

function buildContextBlock(draft: DraftEntry): string {
  return [`Path: ${draft.path}`, "```", draft.draftContent, "```"].join("\n");
}

function buildHistoryMessages(history: WorkspaceMessage[]) {
  return history.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function buildAiMessages(request: AiChatRequest) {
  const contextBlocks = request.attachedDrafts.map(buildContextBlock);
  const formatInstruction = [
    "Return valid JSON with this exact shape:",
    '{"assistantText":"short explanation for the user","proposedContent":"full rewritten file or null"}',
    "If you are rewriting the target file, proposedContent must contain the complete file content.",
    "Do not wrap the JSON in Markdown fences.",
  ].join("\n");

  const targetInstruction = request.targetPath
    ? `The target file being edited is: ${request.targetPath}`
    : "No target file was provided.";

  return [
    request.workspace.systemPrompt.trim()
      ? {
          role: "system",
          content: request.workspace.systemPrompt.trim(),
        }
      : null,
    request.repoStructure?.trim()
      ? {
          role: "system",
          content: `Relevant novel structure:\n\n${request.repoStructure.trim()}`,
        }
      : null,
    contextBlocks.length > 0
      ? {
          role: "system",
          content: `Attached file context:\n\n${contextBlocks.join("\n\n")}`,
        }
      : null,
    {
      role: "system",
      content: [targetInstruction, formatInstruction].join("\n\n"),
    },
    ...buildHistoryMessages(request.history),
    {
      role: "user",
      content: request.prompt,
    },
  ].filter((message): message is { role: string; content: string } => Boolean(message));
}

function tryParseJsonEnvelope(text: string, targetPath?: string): AiChatResponse {
  try {
    const parsed = JSON.parse(text) as {
      assistantText?: unknown;
      proposedContent?: unknown;
    };

    return {
      assistantText:
        typeof parsed.assistantText === "string" && parsed.assistantText.trim().length > 0
          ? parsed.assistantText
          : text,
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

export class OpenRouterBridgeClient {
  async getModels(): Promise<ModelInfo[]> {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: buildHeaders(),
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    const data = (await response.json()) as ModelsResponse;
    if (!Array.isArray(data.data)) {
      throw new Error("OpenRouter returned an unexpected models payload.");
    }

    return data.data.map(normalizeModel).filter((item): item is ModelInfo => item !== null);
  }

  async sendChat(request: AiChatRequest): Promise<AiChatResponse> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({
        model: request.workspace.model,
        messages: buildAiMessages(request),
        temperature: request.workspace.temperature,
        max_completion_tokens: request.workspace.maxCompletionTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    const data = (await response.json()) as ChatResponse;
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new Error("OpenRouter returned an empty assistant response.");
    }

    return tryParseJsonEnvelope(content, request.targetPath);
  }
}
