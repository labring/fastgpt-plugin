import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Ernie',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'ernie-5.1',
      maxContext: 128000,
      maxTokens: 65536,
      quoteMaxToken: 119000,
      maxTemperature: 1,
      vision: false,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ernie-5.0',
      maxContext: 128000,
      maxTokens: 65536,
      quoteMaxToken: 119000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ernie-4.5-turbo-128k',
      maxContext: 138240,
      maxTokens: 12288,
      quoteMaxToken: 125952,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ernie-4.5-turbo-32k',
      maxContext: 39936,
      maxTokens: 12288,
      quoteMaxToken: 27648,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ernie-4.5-turbo-vl-32k',
      maxContext: 39936,
      maxTokens: 12288,
      quoteMaxToken: 27648,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ernie-4.5-turbo-vl',
      maxContext: 142336,
      maxTokens: 16384,
      quoteMaxToken: 125952,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ernie-x1.1',
      maxContext: 121856,
      maxTokens: 65536,
      quoteMaxToken: 56320,
      maxTemperature: 1,
      vision: false,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ernie-x1.1-preview',
      maxContext: 187392,
      maxTokens: 65536,
      quoteMaxToken: 56320,
      maxTemperature: 1,
      vision: false,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ernie-5.0-thinking-latest',
      maxContext: 248832,
      maxTokens: 65536,
      quoteMaxToken: 121856,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ernie-5.0-thinking-preview',
      maxContext: 248832,
      maxTokens: 65536,
      quoteMaxToken: 121856,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
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
