import { OpenAICompatibleProvider } from './openAICompatibleBase';

export class CustomOpenAIProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: 'custom',
      name: 'Custom OpenAI-Compatible Endpoint',
      baseUrl: 'http://localhost:1234/v1',
      defaultModel: 'local-model',
      supportsFim: false,
      modelFamily: 'chat'
    });
  }

  protected override getBaseUrl(): string {
    const config = this.configManager.getConfig();
    return (config.customEndpoint || 'http://localhost:1234/v1').replace(/\/+$/, '');
  }
}
