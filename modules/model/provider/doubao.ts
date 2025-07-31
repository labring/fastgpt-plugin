import { ModelTypeEnum, type ProviderConfigType } from '../type';

const models: ProviderConfigType = {
  provider: 'Doubao',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'doubao-seed-1-6-250615',
      maxContext: 220000,
      maxTokens: 16000,
      quoteMaxToken: 220000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
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
      reasoning: false,
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
      type: ModelTypeEnum.llm,
      model: 'Doubao-1.5-lite-32k',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Doubao-1.5-pro-32k',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Doubao-1.5-pro-256k',
      maxContext: 256000,
      maxTokens: 12000,
      quoteMaxToken: 256000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Doubao-1.5-vision-pro-32k',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Doubao-lite-4k',
      maxContext: 4000,
      maxTokens: 4000,
      quoteMaxToken: 4000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Doubao-lite-32k',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Doubao-lite-128k',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Doubao-vision-lite-32k',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Doubao-pro-4k',
      maxContext: 4000,
      maxTokens: 4000,
      quoteMaxToken: 4000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Doubao-pro-32k',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Doubao-pro-128k',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Doubao-vision-pro-32k',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'Doubao-embedding-large',
      defaultToken: 512,
      maxToken: 4096,
      normalization: true
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'Doubao-embedding',
      defaultToken: 512,
      maxToken: 4096,
      normalization: true
    }
  ]
};

export default models;
