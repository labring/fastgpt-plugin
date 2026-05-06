import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Gemini',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-3.1-pro-preview-customtools',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-3.1-flash-lite-preview',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-3.1-pro-preview',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-3.1-pro',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-3-flash-preview',
      maxContext: 1024000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-3-flash',
      maxContext: 1024000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.5-pro',
      maxContext: 1000000,
      maxTokens: 63000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
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
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.5-flash-lite',
      maxContext: 1000000,
      maxTokens: 63000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
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
      reasoningEffort: false,
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
      reasoningEffort: false,
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
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'text-embedding-004',
      defaultToken: 512,
      maxToken: 2000
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'gemini-embedding-2-preview',
      defaultToken: 512,
      maxToken: 2000
    }
  ]
};

export default models;
