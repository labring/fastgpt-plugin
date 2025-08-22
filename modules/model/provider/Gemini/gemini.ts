import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Gemini',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.5-pro',
      maxContext: 1000000,
      maxTokens: 63000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.5-flash',
      maxContext: 1000000,
      maxTokens: 63000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.5-pro-exp-03-25',
      maxContext: 1000000,
      maxTokens: 63000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.5-flash-preview-04-17',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.0-flash',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.0-pro-exp',
      maxContext: 2000000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-1.5-flash',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-1.5-pro',
      maxContext: 2000000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.0-flash-exp',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.0-flash-thinking-exp-1219',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.0-flash-thinking-exp-01-21',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-exp-1206',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'text-embedding-004',
      defaultToken: 512,
      maxToken: 2000
    }
  ]
};

export default models;
