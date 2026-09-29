import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'SparkDesk',
  list: [
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 0, outputPrice: 0 }],
      model: 'lite',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 18, outputPrice: 18 }],
      model: 'generalv3',
      maxContext: 8000,
      maxTokens: 8000,
      quoteMaxToken: 8000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 18, outputPrice: 18 }],
      model: 'pro-128k',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 18, outputPrice: 18 }],
      model: 'generalv3.5',
      maxContext: 8000,
      maxTokens: 8000,
      quoteMaxToken: 8000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 24, outputPrice: 24 }],
      model: 'max-32k',
      maxContext: 32000,
      maxTokens: 8000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 30, outputPrice: 30 }],
      model: '4.0Ultra',
      maxContext: 8000,
      maxTokens: 8000,
      quoteMaxToken: 8000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 30, outputPrice: 30 }],
      model: 'spark-x',
      maxContext: 262144,
      maxTokens: 262144,
      quoteMaxToken: 250000,
      maxTemperature: 2,
      vision: false,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    }
  ]
};

export default models;
