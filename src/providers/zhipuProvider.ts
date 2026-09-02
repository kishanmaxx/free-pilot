import { OpenAICompatibleProvider } from './openAICompatibleBase';

export class ZhipuProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: 'zhipu',
      name: 'Zhipu AI 智谱清言 (Free GLM-4-Flash)',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      defaultModel: 'glm-4-flash',
      supportsFim: false,
      modelFamily: 'chat'
    });
  }
}
