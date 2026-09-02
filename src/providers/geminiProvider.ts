import { ChatRequest, CompletionRequest, ProviderId, StreamChunkHandler } from '../types';
import { PromptTemplates } from '../utils/promptTemplates';
import { BaseProvider } from './baseProvider';

export class GeminiProvider extends BaseProvider {
  public readonly id: ProviderId = 'gemini';
  public readonly name = 'Google Gemini (Free Tier)';

  public async completeCode(request: CompletionRequest, signal?: AbortSignal): Promise<string> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured. Run "FreePilot: Set Provider API Key"');
    }

    const config = this.configManager.getConfig();
    const model = config.model.startsWith('gemini') ? config.model : 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const prompt = PromptTemplates.buildFimPrompt(
      request.prefix,
      request.suffix,
      request.languageId,
      request.filename,
      'chat'
    );

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: PromptTemplates.SYSTEM_COMPLETION }]
      },
      generationConfig: {
        temperature: request.temperature ?? 0.1,
        maxOutputTokens: request.maxTokens ?? config.maxCompletionTokens,
        stopSequences: request.stopTokens ?? ['\n\n', '```']
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(body),
      signal
    });

    if (!response.ok) {
      await this.parseHttpError(response, 'Gemini', 'completion');
    }

    const data = (await response.json()) as any;
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return this.cleanCompletionOutput(raw, request.prefix);
  }

  public async chat(
    request: ChatRequest,
    onChunk?: StreamChunkHandler,
    signal?: AbortSignal
  ): Promise<string> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured. Run "FreePilot: Set Provider API Key"');
    }

    const config = this.configManager.getConfig();
    const model = config.model.startsWith('gemini') ? config.model : 'gemini-2.0-flash';

    // Convert messages to Gemini format, filtering out system role (handled via systemInstruction)
    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const systemInstruction = request.systemPrompt || PromptTemplates.SYSTEM_CHAT;

    const body = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: request.temperature ?? config.temperature,
        maxOutputTokens: request.maxTokens ?? config.maxChatTokens
      }
    };

    const authHeaders = {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    };

    if (config.streamChatResponses && onChunk) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
      const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body),
        signal
      });

      if (!response.ok) {
        await this.parseHttpError(response, 'Gemini', 'streaming');
      }

      return this.parseGeminiSseStream(response, onChunk, signal);
    } else {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body),
        signal
      });

      if (!response.ok) {
        await this.parseHttpError(response, 'Gemini', 'chat');
      }

      const data = (await response.json()) as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (onChunk) onChunk(text, text);
      return text;
    }
  }

  private async parseGeminiSseStream(
    response: Response,
    onChunk: StreamChunkHandler,
    signal?: AbortSignal
  ): Promise<string> {
    if (!response.body) throw new Error('Empty response body from Gemini');
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
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr);
              const partText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (partText) {
                accumulated += partText;
                onChunk(partText, accumulated);
              }
            } catch {
              // ignore parse errors
            }
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
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        return { success: false, message: 'API key is missing.' };
      }
      const testReq: ChatRequest = {
        messages: [{ role: 'user', content: 'Say "FreePilot OK"' }],
        maxTokens: 10
      };
      const result = await this.chat(testReq);
      return { success: true, message: `Connected successfully! Response: ${result.trim()}` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection failed' };
    }
  }
}
