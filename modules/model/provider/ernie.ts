import { ModelTypeEnum, type ProviderConfigType } from '../type';

const models: ProviderConfigType = {
  provider: 'Ernie',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'ERNIE-4.0-8K',
      maxContext: 8000,
      maxTokens: 2048,
      quoteMaxToken: 5000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ERNIE-4.0-Turbo-8K',
      maxContext: 8000,
      maxTokens: 2048,
      quoteMaxToken: 5000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ERNIE-Lite-8K',
      maxContext: 8000,
      maxTokens: 2048,
      quoteMaxToken: 6000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ERNIE-Speed-128K',
      maxContext: 128000,
      maxTokens: 4096,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'Embedding-V1',
      defaultToken: 512,
      maxToken: 1000
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'tao-8k',
      defaultToken: 512,
      maxToken: 8000
    }
  ]
};

export default models;
