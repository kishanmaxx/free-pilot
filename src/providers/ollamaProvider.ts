import { ChatRequest, CompletionRequest, ProviderId, StreamChunkHandler } from '../types';
import { PromptTemplates } from '../utils/promptTemplates';
import { BaseProvider } from './baseProvider';

export class OllamaProvider extends BaseProvider {
  public readonly id: ProviderId = 'ollama';
  public readonly name = 'Local Ollama (100% Free & Offline)';

  private getEndpoint(): string {
    const config = this.configManager.getConfig();
    return (config.ollamaEndpoint || 'http://localhost:11434').replace(/\/+$/, '');
  }

  public async completeCode(request: CompletionRequest, signal?: AbortSignal): Promise<string> {
    const config = this.configManager.getConfig();
    const model = config.model.includes('/') ? 'qwen2.5-coder' : config.model || 'qwen2.5-coder';
    const url = `${this.getEndpoint()}/api/generate`;

    // Ollama's native FIM endpoint support (prefix / suffix parameters)
    const body = {
      model,
      prompt: request.prefix,
      suffix: request.suffix,
      stream: false,
      options: {
        temperature: request.temperature ?? 0.1,
        num_predict: request.maxTokens ?? config.maxCompletionTokens,
        stop: request.stopTokens ?? ['\n\n', '```']
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama completion error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as any;
    const raw = data.response || '';
    return this.cleanCompletionOutput(raw, request.prefix);
  }

  public async chat(
    request: ChatRequest,
    onChunk?: StreamChunkHandler,
    signal?: AbortSignal
  ): Promise<string> {
    const config = this.configManager.getConfig();
    const model = config.model.includes('/') ? 'qwen2.5-coder' : config.model || 'qwen2.5-coder';
    const stream = config.streamChatResponses && !!onChunk;
    const url = `${this.getEndpoint()}/api/chat`;

    const messages = [
      {
        role: 'system',
        content: request.systemPrompt || PromptTemplates.SYSTEM_CHAT
      },
      ...request.messages
    ];

    const body = {
      model,
      messages,
      stream,
      options: {
        temperature: request.temperature ?? config.temperature,
        num_predict: request.maxTokens ?? config.maxChatTokens
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama chat error (${response.status}): ${errText}`);
    }

    if (stream) {
      return this.parseOllamaStream(response, onChunk, signal);
    } else {
      const data = (await response.json()) as any;
      const text = data.message?.content || '';
      if (onChunk) onChunk(text, text);
      return text;
    }
  }

  private async parseOllamaStream(
    response: Response,
    onChunk: StreamChunkHandler,
    signal?: AbortSignal
  ): Promise<string> {
    if (!response.body) throw new Error('Empty response body from Ollama');
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
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            const chunk = parsed.message?.content || '';
            if (chunk) {
              accumulated += chunk;
              onChunk(chunk, accumulated);
            }
          } catch {
            // ignore
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return accumulated;
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const url = `${this.getEndpoint()}/api/tags`;
      const response = await fetch(url);
      if (!response.ok) {
        return { success: false, message: `Ollama returned HTTP ${response.status}` };
      }
      const data = (await response.json()) as any;
      const models = (data.models || []).map((m: any) => m.name).join(', ');
      return {
        success: true,
        message: `Connected to Ollama! Local models found: ${models || 'None installed yet'}`
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Cannot reach Ollama at ${this.getEndpoint()}. Is Ollama running? (ollama serve)`
      };
    }
  }
}
