import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'MistralAI',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'ministral-3b-latest',
      maxContext: 130000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ministral-8b-latest',
      maxContext: 130000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'mistral-large-latest',
      maxContext: 130000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'mistral-small-latest',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 32000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: false,
      toolChoice: true
    }
  ]
};

export default models;
