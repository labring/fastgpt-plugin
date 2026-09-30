import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Yi',
  list: [
    {
      type: ModelTypeEnum.llm,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 12, outputPrice: 12 }],
      model: 'yi-medium-200k',
      maxContext: 200000,
      maxTokens: 4000,
      quoteMaxToken: 190000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 2.5, outputPrice: 2.5 }],
      model: 'yi-medium',
      maxContext: 16000,
      maxTokens: 4000,
      quoteMaxToken: 12000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 0.99, outputPrice: 0.99 }],
      model: 'yi-lightning',
      maxContext: 16000,
      maxTokens: 4000,
      quoteMaxToken: 12000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 6, outputPrice: 6 }],
      model: 'yi-vision-v2',
      maxContext: 16000,
      maxTokens: 4000,
      quoteMaxToken: 12000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    }
  ]
};

export default models;
