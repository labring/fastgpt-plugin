import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Baichuan',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'Baichuan4',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 100000,
      maxTemperature: 1.2,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Baichuan4-Turbo',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 100000,
      maxTemperature: 1.2,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Baichuan-M3',
      maxContext: 128000,
      maxTokens: 5000,
      quoteMaxToken: 100000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Baichuan-M3-Plus',
      maxContext: 128000,
      maxTokens: 5000,
      quoteMaxToken: 100000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Baichuan2-Turbo',
      maxContext: 32000,
      maxTokens: 2000,
      quoteMaxToken: 30000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    }
  ]
};

export default models;
