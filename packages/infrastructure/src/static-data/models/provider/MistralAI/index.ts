import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'MistralAI',
  list: [
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 14, outputPrice: 42 }],
      model: 'mistral-large-3-25-12',
      maxContext: 256000,
      maxTokens: 8000,
      quoteMaxToken: 240000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 3.5, outputPrice: 10.5 }],
      model: 'mistral-large-2512',
      maxContext: 256000,
      maxTokens: 8000,
      quoteMaxToken: 240000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 1.4, outputPrice: 4.2 }],
      model: 'mistral-small-4-0-26-03',
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
      priceTiers: [{ inputPrice: 1.05, outputPrice: 4.2 }],
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
      priceTiers: [{ inputPrice: 4.2, outputPrice: 12.6 }],
      model: 'mistral-medium-3-5-26-04',
      maxContext: 256000,
      maxTokens: 32000,
      quoteMaxToken: 240000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 10.5, outputPrice: 52.5 }],
      model: 'mistral-medium-3-5',
      maxContext: 256000,
      maxTokens: 32000,
      quoteMaxToken: 240000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 1.4, outputPrice: 1.4 }],
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
      priceTiers: [{ inputPrice: 1.05, outputPrice: 1.05 }],
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
      priceTiers: [{ inputPrice: 0.7, outputPrice: 0.7 }],
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
      priceTiers: [{ inputPrice: 0.28, outputPrice: 0.28 }],
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
      priceTiers: [{ inputPrice: 0.7, outputPrice: 0.7 }],
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
      priceTiers: [{ inputPrice: 14, outputPrice: 42 }],
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
      priceTiers: [{ inputPrice: 1.4, outputPrice: 4.2 }],
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
