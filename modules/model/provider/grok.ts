import { ModelTypeEnum, type ProviderConfigType } from '../type';

const models: ProviderConfigType = {
  provider: 'Grok',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'grok-4',
      maxContext: 256000,
      maxTokens: 8000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-4-0709',
      maxContext: 256000,
      maxTokens: 8000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-3-mini',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-3-mini-fast',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-3',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-3-fast',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    }
  ]
};

export default models;
