import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Hunyuan',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-large',
      maxContext: 28000,
      maxTokens: 4000,
      quoteMaxToken: 20000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-lite',
      maxContext: 250000,
      maxTokens: 6000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-pro',
      maxContext: 28000,
      maxTokens: 4000,
      quoteMaxToken: 28000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-standard',
      maxContext: 32000,
      maxTokens: 2000,
      quoteMaxToken: 20000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-turbo-vision',
      maxContext: 6000,
      maxTokens: 2000,
      quoteMaxToken: 6000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-turbo',
      maxContext: 28000,
      maxTokens: 4000,
      quoteMaxToken: 20000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-a13b',
      maxContext: 224000,
      maxTokens: 32000,
      quoteMaxToken: 224000,
      maxTemperature: 1,
      vision: false,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-turbos-latest',
      maxContext: 32000,
      maxTokens: 16000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-t1-latest',
      maxContext: 32000,
      maxTokens: 64000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-2.0-instruct-20251111',
      maxContext: 128000,
      maxTokens: 16000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: false,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-2.0-thinking-20251109',
      maxContext: 128000,
      maxTokens: 64000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-vision',
      maxContext: 6000,
      maxTokens: 2000,
      quoteMaxToken: 4000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'hunyuan-embedding',
      defaultToken: 512,
      maxToken: 1024
    }
  ]
};

export default models;
