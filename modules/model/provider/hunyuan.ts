import { ModelTypeEnum, type ProviderConfigType } from '../type';

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
