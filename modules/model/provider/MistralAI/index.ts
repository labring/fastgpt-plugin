import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'MistralAI',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'mistral-large-2512',
      maxContext: 131000,
      maxTokens: 8000,
      quoteMaxToken: 120000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'mistral-small-2603',
      maxContext: 256000,
      maxTokens: 32000,
      quoteMaxToken: 240000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'mistral-medium-2508',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 120000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'devstral-2512',
      maxContext: 131000,
      maxTokens: 8000,
      quoteMaxToken: 120000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ministral-14b-2512',
      maxContext: 131000,
      maxTokens: 8000,
      quoteMaxToken: 120000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ministral-8b-2512',
      maxContext: 131000,
      maxTokens: 8000,
      quoteMaxToken: 120000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ministral-3b-2512',
      maxContext: 131000,
      maxTokens: 8000,
      quoteMaxToken: 120000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'ministral-3b-latest',
      maxContext: 130000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
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
      reasoningEffort: false,
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
      reasoningEffort: false,
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
      reasoningEffort: false,
      toolChoice: true
    }
  ]
};

export default models;
