import { OpenAICompatibleProvider } from './openAICompatibleBase';

export class DashscopeProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: 'dashscope',
      name: 'Alibaba DashScope 通义千问 (Qwen)',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      defaultModel: 'qwen2.5-coder-32b-instruct',
      supportsFim: true,
      modelFamily: 'deepseek'
    });
  }
}
