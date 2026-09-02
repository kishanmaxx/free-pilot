export type ProviderId =
  | 'gemini'
  | 'groq'
  | 'siliconflow'
  | 'zhipu'
  | 'deepseek'
  | 'dashscope'
  | 'openrouter'
  | 'mistral'
  | 'cerebras'
  | 'ollama'
  | 'custom';

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderId;
  description: string;
  freeTierNote: string;
  isDefault?: boolean;
  contextWindow?: number;
  supportsFim?: boolean;
}

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  flag: string;
  tagline: string;
  apiKeyHelpUrl: string;
  requiresApiKey: boolean;
  defaultModel: string;
  models: ModelInfo[];
  defaultBaseUrl?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  prefix: string;
  suffix: string;
  languageId: string;
  filename: string;
  maxTokens?: number;
  temperature?: number;
  stopTokens?: string[];
}

export interface ChatRequest {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  stream?: boolean;
}

export type StreamChunkHandler = (chunk: string, accumulated: string) => void;

export interface ILLMProvider {
  readonly id: ProviderId;
  readonly name: string;

  getApiKey(): Promise<string | undefined>;
  setApiKey(key: string): Promise<void>;
  hasValidApiKey(): Promise<boolean>;

  completeCode(request: CompletionRequest, signal?: AbortSignal): Promise<string>;
  chat(
    request: ChatRequest,
    onChunk?: StreamChunkHandler,
    signal?: AbortSignal
  ): Promise<string>;

  testConnection(): Promise<{ success: boolean; message: string }>;
}

export interface FreePilotConfig {
  provider: ProviderId;
  model: string;
  enableInlineCompletions: boolean;
  inlineCompletionDelayMs: number;
  maxCompletionTokens: number;
  maxChatTokens: number;
  temperature: number;
  ollamaEndpoint: string;
  customEndpoint: string;
  streamChatResponses: boolean;
}
