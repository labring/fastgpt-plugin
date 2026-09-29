import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Intern',
  list: [
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 15, outputPrice: 30 }],
      model: 'internlm2-pro-chat',
      maxContext: 32000,
      maxTokens: 8000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 0.8, outputPrice: 1.6 }],
      model: 'internlm3-8b-instruct',
      maxContext: 32000,
      maxTokens: 8000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    }
  ]
};

export default models;
