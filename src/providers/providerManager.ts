import { ConfigManager } from '../config';
import { ILLMProvider, ModelInfo, ProviderId, ProviderMeta } from '../types';
import { CerebrasProvider } from './cerebrasProvider';
import { CustomOpenAIProvider } from './customOpenAIProvider';
import { DashscopeProvider } from './dashscopeProvider';
import { DeepSeekProvider } from './deepseekProvider';
import { GeminiProvider } from './geminiProvider';
import { GroqProvider } from './groqProvider';
import { MistralProvider } from './mistralProvider';
import { OllamaProvider } from './ollamaProvider';
import { OpenRouterProvider } from './openRouterProvider';
import { SiliconFlowProvider } from './siliconFlowProvider';
import { ZhipuProvider } from './zhipuProvider';

export class ProviderManager {
  private static instance: ProviderManager;
  private providers: Map<ProviderId, ILLMProvider> = new Map();
  private configManager = ConfigManager.getInstance();

  private metadata: Record<ProviderId, ProviderMeta> = {
    gemini: {
      id: 'gemini',
      name: 'Google Gemini',
      flag: '🇺🇸',
      tagline: 'Fast, high-quality free tier from Google AI Studio',
      apiKeyHelpUrl: 'https://aistudio.google.com/app/apikey',
      requiresApiKey: true,
      defaultModel: 'gemini-2.0-flash',
      models: [
        {
          id: 'gemini-2.0-flash',
          name: 'Gemini 2.0 Flash (Recommended)',
          provider: 'gemini',
          description: 'Next-gen multimodal model with blazing speed & 1M context',
          freeTierNote: '15 RPM / 1M TPM free forever on Google AI Studio',
          isDefault: true,
          contextWindow: 1048576
        },
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          provider: 'gemini',
          description: 'Lightweight, ultra-fast coding & chat assistant',
          freeTierNote: '15 RPM / 1M TPM free tier',
          contextWindow: 1048576
        },
        {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          provider: 'gemini',
          description: 'High-reasoning model for complex debugging and architectural tasks',
          freeTierNote: '2 RPM / 32k TPM free tier',
          contextWindow: 2097152
        }
      ]
    },
    siliconflow: {
      id: 'siliconflow',
      name: 'SiliconFlow (硅基流动)',
      flag: '🇨🇳',
      tagline: 'Chinese cloud aggregator with permanent free DeepSeek R1/V3 & Qwen 2.5 Coder',
      apiKeyHelpUrl: 'https://cloud.siliconflow.cn/account/ak',
      requiresApiKey: true,
      defaultModel: 'deepseek-ai/DeepSeek-V3',
      models: [
        {
          id: 'deepseek-ai/DeepSeek-V3',
          name: 'DeepSeek V3 (SiliconFlow Free)',
          provider: 'siliconflow',
          description: 'Top-tier 671B MoE model for coding and reasoning',
          freeTierNote: 'Free tier available on SiliconCloud platform',
          isDefault: true,
          supportsFim: true
        },
        {
          id: 'deepseek-ai/DeepSeek-R1',
          name: 'DeepSeek R1 (SiliconFlow Free)',
          provider: 'siliconflow',
          description: 'Open-weights reasoning model matching OpenAI o1',
          freeTierNote: 'Free tier quota available',
          supportsFim: true
        },
        {
          id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
          name: 'Qwen 2.5 Coder 32B (SiliconFlow Free)',
          provider: 'siliconflow',
          description: 'Alibaba code-specialized powerhouse model',
          freeTierNote: 'Free tier token quota',
          supportsFim: true
        },
        {
          id: 'THUDM/glm-4-9b-chat',
          name: 'GLM 4 9B Chat (SiliconFlow Free)',
          provider: 'siliconflow',
          description: 'Zhipu / Tsinghua open model',
          freeTierNote: '100% Free on SiliconCloud'
        }
      ]
    },
    zhipu: {
      id: 'zhipu',
      name: 'Zhipu AI (智谱清言)',
      flag: '🇨🇳',
      tagline: 'Leading Chinese AI lab - GLM-4-Flash is permanently 100% free',
      apiKeyHelpUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
      requiresApiKey: true,
      defaultModel: 'glm-4-flash',
      models: [
        {
          id: 'glm-4-flash',
          name: 'GLM-4-Flash (Permanently Free)',
          provider: 'zhipu',
          description: 'High-speed model optimized for coding & multilingual conversation',
          freeTierNote: '100% Free Forever with unlimited calls on BigModel platform',
          isDefault: true,
          contextWindow: 128000
        }
      ]
    },
    deepseek: {
      id: 'deepseek',
      name: 'DeepSeek Official API',
      flag: '🇨🇳',
      tagline: 'Direct DeepSeek API for DeepSeek-V3 & DeepSeek-R1',
      apiKeyHelpUrl: 'https://platform.deepseek.com/api_keys',
      requiresApiKey: true,
      defaultModel: 'deepseek-chat',
      models: [
        {
          id: 'deepseek-chat',
          name: 'DeepSeek V3 (deepseek-chat)',
          provider: 'deepseek',
          description: 'Flagship general & coding model (671B)',
          freeTierNote: 'Includes free starter balance for new accounts',
          isDefault: true,
          supportsFim: true
        },
        {
          id: 'deepseek-reasoner',
          name: 'DeepSeek R1 (deepseek-reasoner)',
          provider: 'deepseek',
          description: 'Reasoning model with step-by-step chain of thought',
          freeTierNote: 'Includes free starter balance for new accounts',
          supportsFim: true
        }
      ]
    },
    dashscope: {
      id: 'dashscope',
      name: 'Alibaba DashScope (通义千问)',
      flag: '🇨🇳',
      tagline: 'Alibaba Cloud Qwen series with generous free quota',
      apiKeyHelpUrl: 'https://dashscope.console.aliyun.com/apiKey',
      requiresApiKey: true,
      defaultModel: 'qwen2.5-coder-32b-instruct',
      models: [
        {
          id: 'qwen2.5-coder-32b-instruct',
          name: 'Qwen 2.5 Coder 32B Instruct',
          provider: 'dashscope',
          description: 'Specialized coding model with state-of-the-art code completion',
          freeTierNote: 'Free token quota on DashScope',
          isDefault: true,
          supportsFim: true
        },
        {
          id: 'qwen-plus',
          name: 'Qwen Plus',
          provider: 'dashscope',
          description: 'Balanced performance & general capability',
          freeTierNote: 'Free trial quota'
        },
        {
          id: 'qwen-turbo',
          name: 'Qwen Turbo',
          provider: 'dashscope',
          description: 'Ultra-fast low latency model',
          freeTierNote: 'Free token quota'
        }
      ]
    },
    groq: {
      id: 'groq',
      name: 'Groq Cloud',
      flag: '🇺🇸',
      tagline: 'Ultra-fast LPU inference (500+ tokens/sec) with free tier',
      apiKeyHelpUrl: 'https://console.groq.com/keys',
      requiresApiKey: true,
      defaultModel: 'llama-3.3-70b-versatile',
      models: [
        {
          id: 'llama-3.3-70b-versatile',
          name: 'Llama 3.3 70B Versatile',
          provider: 'groq',
          description: 'Meta flagship 70B open weights running at extreme speed',
          freeTierNote: 'Generous free tier with high RPM',
          isDefault: true
        },
        {
          id: 'deepseek-r1-distill-llama-70b',
          name: 'DeepSeek R1 Distill Llama 70B',
          provider: 'groq',
          description: 'R1 reasoning distillation on Llama 70B architecture',
          freeTierNote: 'Free tier on Groq Cloud'
        },
        {
          id: 'llama-3.1-8b-instant',
          name: 'Llama 3.1 8B Instant',
          provider: 'groq',
          description: 'Sub-second latency model ideal for instant completions',
          freeTierNote: 'Free tier with high rate limits'
        },
        {
          id: 'mixtral-8x7b-32768',
          name: 'Mixtral 8x7B 32k',
          provider: 'groq',
          description: 'Mistral 8x7B MoE with 32k context window',
          freeTierNote: 'Free tier on Groq Cloud'
        }
      ]
    },
    openrouter: {
      id: 'openrouter',
      name: 'OpenRouter (Free Models)',
      flag: '🌐',
      tagline: 'Access top open-source models with :free tag',
      apiKeyHelpUrl: 'https://openrouter.ai/keys',
      requiresApiKey: true,
      defaultModel: 'deepseek/deepseek-r1:free',
      models: [
        {
          id: 'deepseek/deepseek-r1:free',
          name: 'DeepSeek R1 (Free)',
          provider: 'openrouter',
          description: 'Full DeepSeek R1 reasoning model available free',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          isDefault: true
        },
        {
          id: 'qwen/qwen-2.5-coder-32b-instruct:free',
          name: 'Qwen 2.5 Coder 32B (Free)',
          provider: 'openrouter',
          description: 'Code-optimized model from Alibaba',
          freeTierNote: '100% Free on OpenRouter (:free tag)'
        },
        {
          id: 'meta-llama/llama-3.3-70b-instruct:free',
          name: 'Llama 3.3 70B Instruct (Free)',
          provider: 'openrouter',
          description: 'Meta latest 70B model',
          freeTierNote: '100% Free on OpenRouter (:free tag)'
        },
        {
          id: 'google/gemini-2.0-flash-exp:free',
          name: 'Gemini 2.0 Flash Exp (Free)',
          provider: 'openrouter',
          description: 'Google Gemini 2.0 via OpenRouter free tier',
          freeTierNote: '100% Free on OpenRouter (:free tag)'
        },
        {
          id: 'mistralai/mistral-small-24b-instruct-2501:free',
          name: 'Mistral Small 24B (Free)',
          provider: 'openrouter',
          description: 'Mistral latest small reasoning model',
          freeTierNote: '100% Free on OpenRouter (:free tag)'
        }
      ]
    },
    mistral: {
      id: 'mistral',
      name: 'Mistral AI',
      flag: '🇫🇷',
      tagline: 'European AI champion with Codestral code model',
      apiKeyHelpUrl: 'https://console.mistral.ai/api-keys/',
      requiresApiKey: true,
      defaultModel: 'codestral-latest',
      models: [
        {
          id: 'codestral-latest',
          name: 'Codestral (Latest)',
          provider: 'mistral',
          description: 'Mistral flagship code generation and FIM model (80+ languages)',
          freeTierNote: 'Free developer tier on Mistral Console',
          isDefault: true,
          supportsFim: true
        },
        {
          id: 'mistral-small-latest',
          name: 'Mistral Small (Latest)',
          provider: 'mistral',
          description: 'Compact, cost-effective reasoning model',
          freeTierNote: 'Free developer tier'
        }
      ]
    },
    cerebras: {
      id: 'cerebras',
      name: 'Cerebras Cloud',
      flag: '🇺🇸',
      tagline: 'World fastest inference engine on Wafer-Scale Engine (1800+ tok/s)',
      apiKeyHelpUrl: 'https://cloud.cerebras.ai/',
      requiresApiKey: true,
      defaultModel: 'llama3.3-70b',
      models: [
        {
          id: 'llama3.3-70b',
          name: 'Llama 3.3 70B (Cerebras)',
          provider: 'cerebras',
          description: 'Meta 70B running at 1800+ tokens/second',
          freeTierNote: 'Free tier available on Cerebras Cloud',
          isDefault: true
        },
        {
          id: 'llama3.1-8b',
          name: 'Llama 3.1 8B (Cerebras)',
          provider: 'cerebras',
          description: 'Meta 8B running at 2100+ tokens/second',
          freeTierNote: 'Free tier with high limits'
        }
      ]
    },
    ollama: {
      id: 'ollama',
      name: 'Local Ollama',
      flag: '💻',
      tagline: '100% Private, Offline & Free on your local machine (No API key needed)',
      apiKeyHelpUrl: 'https://ollama.ai/',
      requiresApiKey: false,
      defaultModel: 'qwen2.5-coder',
      models: [
        {
          id: 'qwen2.5-coder',
          name: 'Qwen 2.5 Coder (Local Ollama)',
          provider: 'ollama',
          description: 'Run `ollama run qwen2.5-coder` locally',
          freeTierNote: '100% Free & Unlimited Offline',
          isDefault: true,
          supportsFim: true
        },
        {
          id: 'deepseek-coder-v2',
          name: 'DeepSeek Coder V2 (Local Ollama)',
          provider: 'ollama',
          description: 'Run `ollama run deepseek-coder-v2` locally',
          freeTierNote: '100% Free & Unlimited Offline',
          supportsFim: true
        },
        {
          id: 'codellama',
          name: 'CodeLlama (Local Ollama)',
          provider: 'ollama',
          description: 'Run `ollama run codellama` locally',
          freeTierNote: '100% Free & Unlimited Offline',
          supportsFim: true
        },
        {
          id: 'llama3.2',
          name: 'Llama 3.2 (Local Ollama)',
          provider: 'ollama',
          description: 'Run `ollama run llama3.2` locally',
          freeTierNote: '100% Free & Unlimited Offline'
        }
      ]
    },
    custom: {
      id: 'custom',
      name: 'Custom OpenAI-Compatible',
      flag: '🛠️',
      tagline: 'Connect to LM Studio, LocalAI, vLLM, FastChat, or private servers',
      apiKeyHelpUrl: 'http://localhost:1234',
      requiresApiKey: false,
      defaultModel: 'local-model',
      models: [
        {
          id: 'local-model',
          name: 'Custom Endpoint Model',
          provider: 'custom',
          description: 'Model hosted on your custom endpoint URL',
          freeTierNote: 'Self-hosted / Custom',
          isDefault: true
        }
      ]
    }
  };

  private constructor() {
    this.registerProviders();
  }

  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  private registerProviders(): void {
    this.providers.set('gemini', new GeminiProvider());
    this.providers.set('siliconflow', new SiliconFlowProvider());
    this.providers.set('zhipu', new ZhipuProvider());
    this.providers.set('deepseek', new DeepSeekProvider());
    this.providers.set('dashscope', new DashscopeProvider());
    this.providers.set('groq', new GroqProvider());
    this.providers.set('cerebras', new CerebrasProvider());
    this.providers.set('openrouter', new OpenRouterProvider());
    this.providers.set('mistral', new MistralProvider());
    this.providers.set('ollama', new OllamaProvider());
    this.providers.set('custom', new CustomOpenAIProvider());
  }

  public getProvider(id?: ProviderId): ILLMProvider {
    const activeId = id || this.configManager.getConfig().provider;
    const provider = this.providers.get(activeId);
    if (!provider) {
      return this.providers.get('gemini')!;
    }
    return provider;
  }

  public getAllProvidersMeta(): ProviderMeta[] {
    return Object.values(this.metadata);
  }

  public getProviderMeta(id: ProviderId): ProviderMeta {
    return this.metadata[id] || this.metadata.gemini;
  }

  public getAllModels(): ModelInfo[] {
    const list: ModelInfo[] = [];
    for (const meta of Object.values(this.metadata)) {
      list.push(...meta.models);
    }
    return list;
  }
}
