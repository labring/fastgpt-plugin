import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Doubao',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'doubao-seed-1-8-251228',
      maxContext: 220000,
      maxTokens: 16000,
      quoteMaxToken: 220000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'doubao-seed-1-6-251015',
      maxContext: 220000,
      maxTokens: 16000,
      quoteMaxToken: 220000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'doubao-seed-1-6-250615',
      maxContext: 220000,
      maxTokens: 16000,
      quoteMaxToken: 220000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'doubao-seed-1-6-flash-250828',
      maxContext: 220000,
      maxTokens: 16000,
      quoteMaxToken: 220000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'doubao-seed-1-6-flash-250615',
      maxContext: 220000,
      maxTokens: 16000,
      quoteMaxToken: 220000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'doubao-seed-1-6-thinking-250615',
      maxContext: 220000,
      maxTokens: 16000,
      quoteMaxToken: 220000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'doubao-embedding-large-text-250515',
      defaultToken: 512,
      maxToken: 4096,
      normalization: true
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'doubao-embedding-text-240715',
      defaultToken: 512,
      maxToken: 4096,
      normalization: true
    }
  ]
};

export default models;
