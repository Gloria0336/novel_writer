import type { ModelInfo, OpenRouterChatRequest } from "../types/app";

interface ModelsResponse {
  data: Array<{
    id: string;
    name: string;
    description?: string;
    context_length: number;
    architecture: {
      input_modalities?: string[];
      output_modalities?: string[];
    };
    supported_parameters?: string[];
  }>;
}

interface ChatResponse {
  choices: Array<{
    message: {
      role: "assistant";
      content: string;
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
    "X-OpenRouter-Title": "小說工作台",
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

    const data = (await response.json()) as ModelsResponse;
    return data.data
      .map((model) => ({
        id: model.id,
        name: model.name,
        description: model.description,
        contextLength: model.context_length,
        inputModalities: model.architecture.input_modalities ?? [],
        outputModalities: model.architecture.output_modalities ?? [],
        supportedParameters: model.supported_parameters ?? [],
      }))
      .filter((model) => model.outputModalities.includes("text"));
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

    const data = (await response.json()) as ChatResponse;
    return data.choices[0]?.message.content ?? "";
  }

  async testConnection(): Promise<void> {
    await this.getModels();
  }
}
