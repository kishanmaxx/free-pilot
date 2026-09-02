import { ChatRequest, CompletionRequest, ProviderId, StreamChunkHandler } from '../types';
import { PromptTemplates } from '../utils/promptTemplates';
import { BaseProvider } from './baseProvider';

export interface OpenAICompatibleOptions {
  id: ProviderId;
  name: string;
  baseUrl: string;
  defaultModel: string;
  supportsFim?: boolean;
  modelFamily?: 'deepseek' | 'codellama' | 'starcoder' | 'chat';
  customHeaders?: Record<string, string>;
}

export class OpenAICompatibleProvider extends BaseProvider {
  public readonly id: ProviderId;
  public readonly name: string;
  protected baseUrl: string;
  protected defaultModel: string;
  protected supportsFim: boolean;
  protected modelFamily: 'deepseek' | 'codellama' | 'starcoder' | 'chat';
  protected customHeaders: Record<string, string>;

  constructor(options: OpenAICompatibleOptions) {
    super();
    this.id = options.id;
    this.name = options.name;
    this.baseUrl = options.baseUrl;
    this.defaultModel = options.defaultModel;
    this.supportsFim = options.supportsFim ?? false;
    this.modelFamily = options.modelFamily ?? 'chat';
    this.customHeaders = options.customHeaders ?? {};
  }

  protected getBaseUrl(): string {
    return this.baseUrl;
  }

  public async completeCode(request: CompletionRequest, signal?: AbortSignal): Promise<string> {
    const apiKey = await this.getApiKey();
    if (!apiKey && this.id !== 'ollama') {
      throw new Error(`${this.name} API key is not configured. Run "FreePilot: Set Provider API Key"`);
    }

    const config = this.configManager.getConfig();
    const model = config.model || this.defaultModel;
    const url = `${this.getBaseUrl().replace(/\/+$/, '')}/chat/completions`;

    const prompt = PromptTemplates.buildFimPrompt(
      request.prefix,
      request.suffix,
      request.languageId,
      request.filename,
      this.modelFamily
    );

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.customHeaders
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const body = {
      model,
      messages: [
        { role: 'system', content: PromptTemplates.SYSTEM_COMPLETION },
        { role: 'user', content: prompt }
      ],
      temperature: request.temperature ?? 0.1,
      max_tokens: request.maxTokens ?? config.maxCompletionTokens,
      stop: request.stopTokens ?? ['\n\n', '```']
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal
    });

    if (!response.ok) {
      await this.parseHttpError(response, this.name, 'completion');
    }

    const data = (await response.json()) as any;
    const raw = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
    return this.cleanCompletionOutput(raw, request.prefix);
  }

  public async chat(
    request: ChatRequest,
    onChunk?: StreamChunkHandler,
    signal?: AbortSignal
  ): Promise<string> {
    const apiKey = await this.getApiKey();
    if (!apiKey && this.id !== 'ollama') {
      throw new Error(`${this.name} API key is not configured. Run "FreePilot: Set Provider API Key"`);
    }

    const config = this.configManager.getConfig();
    const model = config.model || this.defaultModel;
    const url = `${this.getBaseUrl().replace(/\/+$/, '')}/chat/completions`;

    const messages = [
      {
        role: 'system',
        content: request.systemPrompt || PromptTemplates.SYSTEM_CHAT
      },
      ...request.messages
    ];

    const stream = config.streamChatResponses && !!onChunk;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.customHeaders
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const body = {
      model,
      messages,
      temperature: request.temperature ?? config.temperature,
      max_tokens: request.maxTokens ?? config.maxChatTokens,
      stream
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal
    });

    if (!response.ok) {
      await this.parseHttpError(response, this.name, 'chat');
    }

    if (stream) {
      return this.parseOpenAIStream(response, onChunk, signal);
    } else {
      const data = (await response.json()) as any;
      const text =
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.message?.reasoning_content ||
        '';
      if (onChunk) onChunk(text, text);
      return text;
    }
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey && this.id !== 'ollama') {
        return { success: false, message: 'API key is missing.' };
      }
      const testReq: ChatRequest = {
        messages: [{ role: 'user', content: 'Say "FreePilot OK"' }],
        maxTokens: 10
      };
      const result = await this.chat(testReq);
      return { success: true, message: `Connected! Response: ${result.trim()}` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection failed' };
    }
  }
}
