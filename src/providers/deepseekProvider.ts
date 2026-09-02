import { OpenAICompatibleProvider } from './openAICompatibleBase';

export class DeepSeekProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: 'deepseek',
      name: 'DeepSeek Official API (V3 / R1)',
      baseUrl: 'https://api.deepseek.com/v1',
      defaultModel: 'deepseek-chat',
      supportsFim: true,
      modelFamily: 'deepseek'
    });
  }
}
