import { OpenAICompatibleProvider } from './openAICompatibleBase';

export class MistralProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: 'mistral',
      name: 'Mistral AI (Codestral & Mistral Small)',
      baseUrl: 'https://api.mistral.ai/v1',
      defaultModel: 'codestral-latest',
      supportsFim: true,
      modelFamily: 'chat'
    });
  }
}
