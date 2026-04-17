import type { ModelInfo, OpenRouterChatRequest } from "../types/app";

interface ModelResponseItem {
  id?: string;
  name?: string;
  description?: string;
  context_length?: number;
  architecture?: {
    modality?: string;
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
      role?: "assistant";
      content?: string;
    };
  }>;
}

async function parseError(response: Response): Promise<Error> {
  const body = await response.text();
  return new Error(body || `OpenRouter request failed with ${response.status}`);
}

function buildHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://gloria0336.github.io/novel_writer/",
    "X-OpenRouter-Title": "Novel Writer",
  };
}

function normalizeModalities(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function supportsTextOutput(model: ModelInfo): boolean {
  if (model.outputModalities.includes("text")) {
    return true;
  }

  if (model.outputModalities.length === 0) {
    return true;
  }

  return false;
}

function normalizeModel(item: ModelResponseItem): ModelInfo | null {
  if (typeof item.id !== "string" || item.id.trim().length === 0) {
    return null;
  }

  const inputModalities = normalizeModalities(item.architecture?.input_modalities);
  const outputModalities = normalizeModalities(item.architecture?.output_modalities);
  const supportedParameters = normalizeModalities(item.supported_parameters);

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

export class OpenRouterClient {
  constructor(private readonly apiKey: string) {}

  async getModels(): Promise<ModelInfo[]> {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: buildHeaders(this.apiKey),
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    let data: ModelsResponse;
    try {
      data = (await response.json()) as ModelsResponse;
    } catch {
      throw new Error("OpenRouter returned invalid JSON while loading models.");
    }

    if (!Array.isArray(data.data)) {
      throw new Error("OpenRouter returned an unexpected models payload.");
    }

    return data.data.map(normalizeModel).filter((model): model is ModelInfo => model !== null && supportsTextOutput(model));
  }

  async sendChat(request: OpenRouterChatRequest): Promise<string> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: buildHeaders(this.apiKey),
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_completion_tokens: request.maxCompletionTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    let data: ChatResponse;
    try {
      data = (await response.json()) as ChatResponse;
    } catch {
      throw new Error("OpenRouter returned invalid JSON while generating text.");
    }

    return typeof data.choices?.[0]?.message?.content === "string" ? data.choices[0].message.content : "";
  }

  async testConnection(): Promise<void> {
    await this.getModels();
  }
}
