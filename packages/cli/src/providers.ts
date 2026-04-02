import type { ModelConfig } from "./config.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface LLMProvider {
  chat(messages: ChatMessage[], onChunk?: (chunk: StreamChunk) => void): Promise<string>;
  models(): Promise<string[]>;
  name: string;
}

const SYSTEM_PROMPT = `You are NexusForge AI, an expert coding assistant. You help developers write, debug, refactor, and understand code. You provide:

1. Clear, well-structured code with best practices
2. Explanations when asked
3. Security-aware suggestions
4. Performance-conscious recommendations

When generating code:
- Use modern syntax and patterns
- Include error handling
- Follow the language's conventions
- Suggest tests when appropriate

When asked about files or projects, analyze the context provided and give actionable advice.
Respond in Markdown format for code blocks and formatting.`;

export class OllamaProvider implements LLMProvider {
  name = "Ollama";
  private baseUrl: string;
  private model: string;

  constructor(config: ModelConfig) {
    this.baseUrl = config.baseUrl || "http://localhost:11434";
    this.model = config.model;
  }

  async chat(messages: ChatMessage[], onChunk?: (chunk: StreamChunk) => void): Promise<string> {
    const allMessages = [{ role: "system" as const, content: SYSTEM_PROMPT }, ...messages];

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: allMessages,
        stream: !!onChunk,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    if (onChunk && response.body) {
      let fullContent = "";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            const content = json.message?.content || "";
            fullContent += content;
            onChunk({ content, done: json.done || false });
          } catch {
            continue;
          }
        }
      }
      return fullContent;
    }

    const data = await response.json();
    return data.message?.content || "";
  }

  async models(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch {
      return [];
    }
  }
}

export class OpenAIProvider implements LLMProvider {
  name = "OpenAI";
  private baseUrl: string;
  private model: string;
  private apiKey: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: ModelConfig) {
    this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
    this.model = config.model;
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || "";
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 4096;
  }

  async chat(messages: ChatMessage[], onChunk?: (chunk: StreamChunk) => void): Promise<string> {
    if (!this.apiKey) throw new Error("OpenAI API key not configured. Run: nexusforge config set-key openai-gpt4 <key>");

    const allMessages = [{ role: "system" as const, content: SYSTEM_PROMPT }, ...messages];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: allMessages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: !!onChunk,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${response.status} — ${err}`);
    }

    if (onChunk && response.body) {
      let fullContent = "";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            onChunk({ content: "", done: true });
            break;
          }
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content || "";
            fullContent += content;
            onChunk({ content, done: false });
          } catch {
            continue;
          }
        }
      }
      return fullContent;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async models(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      const data = await response.json();
      return data.data?.map((m: { id: string }) => m.id).filter((id: string) => id.includes("gpt")) || [];
    } catch {
      return [];
    }
  }
}

export class AnthropicProvider implements LLMProvider {
  name = "Anthropic";
  private baseUrl: string;
  private model: string;
  private apiKey: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: ModelConfig) {
    this.baseUrl = config.baseUrl || "https://api.anthropic.com/v1";
    this.model = config.model;
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || "";
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 4096;
  }

  async chat(messages: ChatMessage[], onChunk?: (chunk: StreamChunk) => void): Promise<string> {
    if (!this.apiKey) throw new Error("Anthropic API key not configured. Run: nexusforge config set-key anthropic-claude <key>");

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role === "system" ? "user" : m.role, content: m.content })),
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: !!onChunk,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic error: ${response.status} — ${err}`);
    }

    if (onChunk && response.body) {
      let fullContent = "";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6).trim();
          try {
            const json = JSON.parse(data);
            if (json.type === "content_block_delta") {
              const content = json.delta?.text || "";
              fullContent += content;
              onChunk({ content, done: false });
            }
            if (json.type === "message_stop") {
              onChunk({ content: "", done: true });
            }
          } catch {
            continue;
          }
        }
      }
      return fullContent;
    }

    const data = await response.json();
    return data.content?.[0]?.text || "";
  }

  async models(): Promise<string[]> {
    return ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"];
  }
}

export function createProvider(config: ModelConfig): LLMProvider {
  switch (config.provider) {
    case "ollama":
      return new OllamaProvider(config);
    case "openai":
      return new OpenAIProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "custom":
      return new OpenAIProvider(config);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}