import { ConfigManager } from '../config';
import {
  ChatMessage,
  ChatRequest,
  CompletionRequest,
  ILLMProvider,
  ProviderId,
  StreamChunkHandler
} from '../types';

export abstract class BaseProvider implements ILLMProvider {
  public abstract readonly id: ProviderId;
  public abstract readonly name: string;
  protected configManager = ConfigManager.getInstance();

  public async getApiKey(): Promise<string | undefined> {
    return this.configManager.getApiKey(this.id);
  }

  public async setApiKey(key: string): Promise<void> {
    await this.configManager.setApiKey(this.id, key);
  }

  public async hasValidApiKey(): Promise<boolean> {
    const key = await this.getApiKey();
    return !!key && key.trim().length > 0;
  }

  public abstract completeCode(request: CompletionRequest, signal?: AbortSignal): Promise<string>;

  public abstract chat(
    request: ChatRequest,
    onChunk?: StreamChunkHandler,
    signal?: AbortSignal
  ): Promise<string>;

  public abstract testConnection(): Promise<{ success: boolean; message: string }>;

  /**
   * Helper to clean completion output by removing markdown code blocks or repeated indentation
   */
  protected cleanCompletionOutput(raw: string, prefix: string): string {
    let cleaned = raw;

    // Remove markdown code block fences if returned by model
    const codeBlockMatch = cleaned.match(/^```[\w-]*\n([\s\S]*?)\n?```$/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1];
    } else {
      // Remove starting ``` if any
      cleaned = cleaned.replace(/^```[\w-]*\n?/, '').replace(/\n?```$/, '');
    }

    // Don't duplicate leading prefix if model repeated it
    const lastLineOfPrefix = prefix.split('\n').pop() || '';
    if (lastLineOfPrefix.trim().length > 0 && cleaned.startsWith(lastLineOfPrefix)) {
      cleaned = cleaned.slice(lastLineOfPrefix.length);
    }

    return cleaned;
  }

  /**
   * Helper for SSE stream parsing for OpenAI-compatible APIs
   */
  protected async parseOpenAIStream(
    response: Response,
    onChunk?: StreamChunkHandler,
    signal?: AbortSignal
  ): Promise<string> {
    if (!response.body) {
      throw new Error('Response body is empty');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulated = '';
    let buffer = '';

    try {
      while (true) {
        if (signal?.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed === 'data: [DONE]') {
            return accumulated;
          }

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr);
              const delta =
                parsed.choices?.[0]?.delta?.content ||
                parsed.choices?.[0]?.delta?.reasoning_content ||
                parsed.choices?.[0]?.text ||
                '';

              if (delta) {
                accumulated += delta;
                if (onChunk) {
                  onChunk(delta, accumulated);
                }
              }
            } catch {
              // Non-JSON SSE chunk, skip
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return accumulated;
  }
}
