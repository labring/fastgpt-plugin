import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Yi',
  list: [
    {
      type: ModelTypeEnum.llm,
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
