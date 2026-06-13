import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'DeepSeek',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek-v4-flash',
      maxContext: 1000000,
      maxTokens: 384000,
      quoteMaxToken: 960000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek-v4-pro',
      maxContext: 1000000,
      maxTokens: 384000,
      quoteMaxToken: 960000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek-chat',
      maxContext: 64000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek-reasoner',
      maxContext: 64000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: null,
      vision: false,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: false,
      showTopP: false,
      showStopSign: false
    }
  ]
};

export default models;
