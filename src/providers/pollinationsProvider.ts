import { OpenAICompatibleProvider } from './openAICompatibleBase';

export class PollinationsProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: 'pollinations',
      name: 'Pollinations AI (100% Free & No Key Needed)',
      baseUrl: 'https://text.pollinations.ai/openai',
      defaultModel: 'openai-fast',
      supportsFim: true,
      modelFamily: 'chat'
    });
  }
}
