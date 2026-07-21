import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Gemini',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-3.5-flash',
      maxContext: 1048576,
      maxTokens: 65536,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-3.1-pro-preview-customtools',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-3.1-flash-lite',
      maxContext: 1048576,
      maxTokens: 65536,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      audio: true,
      video: true,
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
      audio: true,
      video: true,
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
      audio: true,
      video: true,
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
      audio: true,
      video: true,
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
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'gemini-embedding-2',
      defaultToken: 512,
      maxToken: 8192
    }
  ]
};

export default models;
