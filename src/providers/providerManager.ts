import { ConfigManager } from '../config';
import { ILLMProvider, ModelInfo, ProviderId, ProviderMeta } from '../types';
import { CerebrasProvider } from './cerebrasProvider';
import { CustomOpenAIProvider } from './customOpenAIProvider';
import { DashscopeProvider } from './dashscopeProvider';
import { DeepSeekProvider } from './deepseekProvider';
import { GroqProvider } from './groqProvider';
import { KimiProvider } from './kimiProvider';
import { MistralProvider } from './mistralProvider';
import { OllamaProvider } from './ollamaProvider';
import { OpenRouterProvider } from './openRouterProvider';
import { PollinationsProvider } from './pollinationsProvider';
import { SiliconFlowProvider } from './siliconFlowProvider';
import { ZhipuProvider } from './zhipuProvider';

export class ProviderManager {
  private static instance: ProviderManager;
  private providers: Map<ProviderId, ILLMProvider> = new Map();
  private configManager = ConfigManager.getInstance();

  private metadata: Record<ProviderId, ProviderMeta> = {
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
    kimi: {
      id: 'kimi',
      name: 'Moonshot Kimi (月之暗面)',
      flag: '🇨🇳',
      tagline: 'Moonshot AI Kimi with generous free starter token quota & long context',
      apiKeyHelpUrl: 'https://platform.moonshot.cn/console/api-keys',
      requiresApiKey: true,
      defaultModel: 'moonshot-v1-8k',
      models: [
        {
          id: 'moonshot-v1-8k',
          name: 'Kimi 8K (moonshot-v1-8k)',
          provider: 'kimi',
          description: 'Moonshot Kimi model with 8k context window, high speed & coding reasoning',
          freeTierNote: 'Free starter quota on Moonshot platform',
          isDefault: true,
          contextWindow: 8192
        },
        {
          id: 'moonshot-v1-32k',
          name: 'Kimi 32K (moonshot-v1-32k)',
          provider: 'kimi',
          description: 'Expanded 32k context for analyzing entire code files and architectures',
          freeTierNote: 'Free starter quota on Moonshot platform',
          contextWindow: 32768
        },
        {
          id: 'moonshot-v1-128k',
          name: 'Kimi 128K (moonshot-v1-128k)',
          provider: 'kimi',
          description: 'Ultra-long 128k context for large codebases and complex multi-file reasoning',
          freeTierNote: 'Free starter quota on Moonshot platform',
          contextWindow: 131072
        },
        {
          id: 'moonshot-v1-auto',
          name: 'Kimi Auto (moonshot-v1-auto)',
          provider: 'kimi',
          description: 'Automatically balances context length based on conversation tokens',
          freeTierNote: 'Free starter quota on Moonshot platform',
          contextWindow: 131072
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
          id: 'deepseek/deepseek-v4-flash-0731:free',
          name: 'DeepSeek V4 Flash 0731 (Free)',
          provider: 'openrouter',
          description: 'Blazing fast DeepSeek V4 Flash with 1M context (20 req/min)',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          contextWindow: 1048576,
          supportsFim: true
        },
        {
          id: 'cohere/north-mini-code:free',
          name: 'Cohere North Mini Code (Free)',
          provider: 'openrouter',
          description: 'Cohere specialized code generation and refactoring model (256k context)',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          contextWindow: 262144,
          supportsFim: true
        },
        {
          id: 'poolside/laguna-s-2.1:free',
          name: 'Poolside Laguna S 2.1 (Free)',
          provider: 'openrouter',
          description: 'Software engineering agent model from Poolside (262k context)',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          contextWindow: 262144,
          supportsFim: true
        },
        {
          id: 'poolside/laguna-xs-2.1:free',
          name: 'Poolside Laguna XS 2.1 (Free)',
          provider: 'openrouter',
          description: 'Ultra-fast compact coding model for low-latency completions',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          contextWindow: 262144,
          supportsFim: true
        },
        {
          id: 'qwen/qwen3.8-27b:free',
          name: 'Qwen 3.8 27B (Free)',
          provider: 'openrouter',
          description: 'Alibaba code & reasoning powerhouse (262k context, 20 req/min)',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          contextWindow: 262144,
          supportsFim: true
        },
        {
          id: 'qwen/qwen-2.5-coder-32b-instruct:free',
          name: 'Qwen 2.5 Coder 32B (Free)',
          provider: 'openrouter',
          description: 'Code-optimized model from Alibaba',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          supportsFim: true
        },
        {
          id: 'nvidia/nemotron-3.5-lightning:free',
          name: 'NVIDIA Nemotron 3.5 Lightning (Free)',
          provider: 'openrouter',
          description: 'NVIDIA ultra-fast 1M context model (40 req/min)',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          contextWindow: 1048576
        },
        {
          id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
          name: 'NVIDIA Nemotron 3 Ultra 550B (Free)',
          provider: 'openrouter',
          description: 'Massive 550B MoE reasoning model with 1M context (40 req/min)',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          contextWindow: 1048576
        },
        {
          id: 'nvidia/nemotron-3-super-120b-a12b:free',
          name: 'NVIDIA Nemotron 3 Super 120B (Free)',
          provider: 'openrouter',
          description: '120B MoE high-reasoning model (262k context, 40 req/min)',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          contextWindow: 262144
        },
        {
          id: 'z-ai/glm-5.2:free',
          name: 'Z.ai GLM 5.2 (Free)',
          provider: 'openrouter',
          description: 'Latest Zhipu GLM 5.2 architecture for reasoning & instructions',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          contextWindow: 32768
        },
        {
          id: 'openrouter/free',
          name: 'OpenRouter Free Models Router',
          provider: 'openrouter',
          description: 'Auto-routes to the highest-availability free model on OpenRouter',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          contextWindow: 204800
        },
        {
          id: 'google/gemma-4-31b-it:free',
          name: 'Google Gemma 4 31B (Free)',
          provider: 'openrouter',
          description: 'Google open-weights instruction model (262k context)',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          contextWindow: 262144
        },
        {
          id: 'google/gemma-4-26b-a4b-it:free',
          name: 'Google Gemma 4 26B A4B (Free)',
          provider: 'openrouter',
          description: 'Google efficient open-weights model (262k context)',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          contextWindow: 262144
        },
        {
          id: 'thinkingmachines/inkling:free',
          name: 'Thinking Machines Inkling (Free)',
          provider: 'openrouter',
          description: '1M context reasoning and multimodal model',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          contextWindow: 1048576
        },
        {
          id: 'liquid/lfm-2.5-2.6b:free',
          name: 'LiquidAI LFM 2.5 2.6B (Free)',
          provider: 'openrouter',
          description: 'Liquid neural network for fast, low-latency completions (10 req/min)',
          freeTierNote: '100% Free on OpenRouter (:free tag)',
          contextWindow: 65536
        },
        {
          id: 'meta-llama/llama-3.3-70b-instruct:free',
          name: 'Llama 3.3 70B Instruct (Free)',
          provider: 'openrouter',
          description: 'Meta latest 70B model',
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
    pollinations: {
      id: 'pollinations',
      name: 'Pollinations AI',
      flag: '🌸',
      tagline: '100% Free & Unlimited Cloud Inference (No API Key Required)',
      apiKeyHelpUrl: 'https://pollinations.ai/',
      requiresApiKey: false,
      defaultModel: 'openai-fast',
      models: [
        {
          id: 'openai-fast',
          name: 'GPT-OSS 20B Reasoning (Pollinations Free)',
          provider: 'pollinations',
          description: 'High-speed reasoning model running anonymously on Pollinations AI cloud',
          freeTierNote: '100% Free & Unlimited (No key needed)',
          isDefault: true,
          supportsFim: true
        },
        {
          id: 'openai',
          name: 'GPT-OSS (Pollinations Free)',
          provider: 'pollinations',
          description: 'Versatile general-purpose model hosted with zero auth on Pollinations',
          freeTierNote: '100% Free & Unlimited (No key needed)',
          supportsFim: true
        },
        {
          id: 'mistral',
          name: 'Mistral (Pollinations Cloud)',
          provider: 'pollinations',
          description: 'Fast open-weights coding and reasoning model via Pollinations',
          freeTierNote: 'Free tier / Optional enter.pollinations.ai key',
          supportsFim: true
        },
        {
          id: 'gpt-4o',
          name: 'GPT-4o (Pollinations Cloud)',
          provider: 'pollinations',
          description: 'Flagship multimodal reasoning and code generation model',
          freeTierNote: 'Pollinations cloud tier'
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
    this.providers.set('siliconflow', new SiliconFlowProvider());
    this.providers.set('zhipu', new ZhipuProvider());
    this.providers.set('deepseek', new DeepSeekProvider());
    this.providers.set('dashscope', new DashscopeProvider());
    this.providers.set('kimi', new KimiProvider());
    this.providers.set('groq', new GroqProvider());
    this.providers.set('cerebras', new CerebrasProvider());
    this.providers.set('openrouter', new OpenRouterProvider());
    this.providers.set('mistral', new MistralProvider());
    this.providers.set('pollinations', new PollinationsProvider());
    this.providers.set('ollama', new OllamaProvider());
    this.providers.set('custom', new CustomOpenAIProvider());
  }

  public getProvider(id?: ProviderId): ILLMProvider {
    const activeId = id || this.configManager.getConfig().provider;
    const provider = this.providers.get(activeId);
    if (!provider) {
      return this.providers.get('groq')!;
    }
    return provider;
  }

  public getAllProvidersMeta(): ProviderMeta[] {
    return Object.values(this.metadata);
  }

  public getProviderMeta(id: ProviderId): ProviderMeta {
    return this.metadata[id] || this.metadata.groq;
  }

  public getAllModels(): ModelInfo[] {
    const list: ModelInfo[] = [];
    for (const meta of Object.values(this.metadata)) {
      list.push(...meta.models);
    }
    return list;
  }

  public getFallbackProvider(excludeId?: ProviderId): { provider: ILLMProvider; meta: ProviderMeta } | undefined {
    const candidates: ProviderId[] = ['pollinations', 'openrouter', 'groq', 'siliconflow'];
    for (const id of candidates) {
      if (id !== excludeId) {
        const p = this.providers.get(id);
        const meta = this.metadata[id];
        if (p && meta) {
          return { provider: p, meta };
        }
      }
    }
    return undefined;
  }
}
