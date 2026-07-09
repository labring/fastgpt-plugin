import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Grok',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'grok-4.5',
      maxContext: 500000,
      maxTokens: 8000,
      quoteMaxToken: 500000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-4.3',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-4.20-multi-agent-0309',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-4.20-0309-reasoning',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-4.20-0309-non-reasoning',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-build-0.1',
      maxContext: 256000,
      maxTokens: 8000,
      quoteMaxToken: 200000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    }
  ]
};

export default models;
