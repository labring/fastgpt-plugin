import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Claude',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'claude-haiku-4-5-20251001',
      maxContext: 200000,
      maxTokens: 64000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-sonnet-4-5-20250929',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-opus-4-1-20250805',
      maxContext: 200000,
      maxTokens: 32000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-sonnet-4-20250514',
      maxContext: 200000,
      maxTokens: 64000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-opus-4-20250514',
      maxContext: 200000,
      maxTokens: 32000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-3-7-sonnet-20250219',
      maxContext: 200000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-3-5-haiku-20241022',
      maxContext: 200000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-3-5-sonnet-20240620',
      maxContext: 200000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-3-5-sonnet-20241022',
      maxContext: 200000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-3-opus-20240229',
      maxContext: 200000,
      maxTokens: 4096,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    }
  ]
};

export default models;
