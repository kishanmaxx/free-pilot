import { OpenAICompatibleProvider } from './openAICompatibleBase';

export class OpenRouterProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: 'openrouter',
      name: 'OpenRouter (Free Models)',
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'deepseek/deepseek-r1:free',
      supportsFim: true,
      modelFamily: 'deepseek',
      customHeaders: {
        'HTTP-Referer': 'https://github.com/freepilot/free-pilot',
        'X-Title': 'FreePilot VS Code Extension'
      }
    });
  }
}
