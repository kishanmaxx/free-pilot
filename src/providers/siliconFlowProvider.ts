import { OpenAICompatibleProvider } from './openAICompatibleBase';

export class SiliconFlowProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: 'siliconflow',
      name: 'SiliconFlow 硅基流动 (Free Tier)',
      baseUrl: 'https://api.siliconflow.cn/v1',
      defaultModel: 'deepseek-ai/DeepSeek-V3',
      supportsFim: true,
      modelFamily: 'deepseek'
    });
  }
}
