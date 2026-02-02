import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'SparkDesk',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'lite',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'generalv3',
      maxContext: 8000,
      maxTokens: 8000,
      quoteMaxToken: 8000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'pro-128k',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'generalv3.5',
      maxContext: 8000,
      maxTokens: 8000,
      quoteMaxToken: 8000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'max-32k',
      maxContext: 32000,
      maxTokens: 8000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: '4.0Ultra',
      maxContext: 8000,
      maxTokens: 8000,
      quoteMaxToken: 8000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: false
    }
  ]
};

export default models;
