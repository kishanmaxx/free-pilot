import * as vscode from 'vscode';
import { FreePilotConfig, ProviderId } from './types';

export class ConfigManager {
  private static instance: ConfigManager;
  private secretStorage!: vscode.SecretStorage;

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public initialize(context: vscode.ExtensionContext): void {
    this.secretStorage = context.secrets;
  }

  public getConfig(): FreePilotConfig {
    const config = vscode.workspace.getConfiguration('freepilot');
    const completionProvider = config.get<string>('completionProvider', '');
    const completionModel = config.get<string>('completionModel', '');

    return {
      provider: config.get<ProviderId>('provider', 'groq'),
      model: config.get<string>('model', 'llama-3.3-70b-versatile'),
      completionProvider: completionProvider ? (completionProvider as ProviderId) : undefined,
      completionModel: completionModel ? completionModel : undefined,
      enableInlineCompletions: config.get<boolean>('enableInlineCompletions', true),
      inlineCompletionDelayMs: config.get<number>('inlineCompletionDelayMs', 350),
      completionTimeoutMs: config.get<number>('completionTimeoutMs', 8000),
      chatTimeoutMs: config.get<number>('chatTimeoutMs', 50000),
      autoFailover: config.get<boolean>('autoFailover', true),
      maxCompletionTokens: config.get<number>('maxCompletionTokens', 128),
      maxChatTokens: config.get<number>('maxChatTokens', 4096),
      temperature: config.get<number>('temperature', 0.2),
      ollamaEndpoint: config.get<string>('ollamaEndpoint', 'http://localhost:11434'),
      customEndpoint: config.get<string>('customEndpoint', 'http://localhost:1234/v1'),
      streamChatResponses: config.get<boolean>('streamChatResponses', true)
    };
  }

  public async updateConfig<K extends keyof FreePilotConfig>(
    key: K,
    value: FreePilotConfig[K],
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration('freepilot');
    await config.update(key, value, target);
  }

  public async getApiKey(provider: ProviderId): Promise<string | undefined> {
    if (!this.secretStorage) {
      return undefined;
    }
    // Also check environment variables if available
    const secret = await this.secretStorage.get(`freepilot.apikey.${provider}`);
    if (secret && secret.trim().length > 0) {
      return secret.trim();
    }

    const envMap: Record<ProviderId, string> = {
      groq: 'GROQ_API_KEY',
      siliconflow: 'SILICONFLOW_API_KEY',
      zhipu: 'ZHIPU_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
      dashscope: 'DASHSCOPE_API_KEY',
      kimi: 'MOONSHOT_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      mistral: 'MISTRAL_API_KEY',
      cerebras: 'CEREBRAS_API_KEY',
      pollinations: 'POLLINATIONS_API_KEY',
      ollama: '',
      custom: 'CUSTOM_API_KEY'
    };

    const envVar = envMap[provider];
    if (envVar && process.env[envVar]) {
      return process.env[envVar];
    }
    if (provider === 'kimi' && process.env['KIMI_API_KEY']) {
      return process.env['KIMI_API_KEY'];
    }

    return undefined;
  }

  public async setApiKey(provider: ProviderId, apiKey: string): Promise<void> {
    if (!this.secretStorage) {
      throw new Error('SecretStorage is not initialized');
    }
    if (!apiKey || apiKey.trim().length === 0) {
      await this.secretStorage.delete(`freepilot.apikey.${provider}`);
    } else {
      await this.secretStorage.store(`freepilot.apikey.${provider}`, apiKey.trim());
    }
  }

  public async deleteApiKey(provider: ProviderId): Promise<void> {
    if (this.secretStorage) {
      await this.secretStorage.delete(`freepilot.apikey.${provider}`);
    }
  }
}
