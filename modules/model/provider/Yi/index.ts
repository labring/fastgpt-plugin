import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Yi',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'yi-large',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 30000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'yi-medium',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 30000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'yi-spark',
      maxContext: 16000,
      maxTokens: 4000,
      quoteMaxToken: 12000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'yi-text-embedding-v2',
      defaultToken: 512,
      maxToken: 2048,
      defaultConfig: {
        dimensions: 1024
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'yi-lightning',
      maxContext: 16000,
      maxTokens: 4000,
      quoteMaxToken: 12000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'yi-vision-v2',
      maxContext: 16000,
      maxTokens: 4000,
      quoteMaxToken: 12000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: false
    }
  ]
};

export default models;
