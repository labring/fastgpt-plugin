import { ModelTypeEnum, type ProviderConfigType } from '../type';

const models: ProviderConfigType = {
  provider: 'Intern',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'internlm2-pro-chat',
      maxContext: 32000,
      maxTokens: 8000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'internlm3-8b-instruct',
      maxContext: 32000,
      maxTokens: 8000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    }
  ]
};

export default models;
