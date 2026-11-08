import { OpenAICompatibleProvider } from './openAICompatibleBase';

export class KimiProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: 'kimi',
      name: 'Moonshot Kimi (月之暗面)',
      baseUrl: 'https://api.moonshot.cn/v1',
      defaultModel: 'moonshot-v1-8k',
      supportsFim: false,
      modelFamily: 'chat'
    });
  }
}
