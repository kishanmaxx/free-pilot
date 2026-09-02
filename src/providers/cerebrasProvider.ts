import { OpenAICompatibleProvider } from './openAICompatibleBase';

export class CerebrasProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: 'cerebras',
      name: 'Cerebras Cloud (1000+ tok/s Free Tier)',
      baseUrl: 'https://api.cerebras.ai/v1',
      defaultModel: 'llama3.3-70b',
      supportsFim: false,
      modelFamily: 'chat'
    });
  }
}
