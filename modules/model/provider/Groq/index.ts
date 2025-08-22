import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Groq',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'llama-3.1-8b-instant',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'llama-3.3-70b-versatile',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
      toolChoice: true
    }
  ]
};

export default models;
