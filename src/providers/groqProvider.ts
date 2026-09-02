import { OpenAICompatibleProvider } from './openAICompatibleBase';

export class GroqProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      id: 'groq',
      name: 'Groq Cloud (Fast Free Tier)',
      baseUrl: 'https://api.groq.com/openai/v1',
      defaultModel: 'llama-3.3-70b-versatile',
      supportsFim: false,
      modelFamily: 'chat'
    });
  }
}
