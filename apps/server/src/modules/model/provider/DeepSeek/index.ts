import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'DeepSeek',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek-v3.2',
      maxContext: 125000,
      maxTokens: 32000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
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
      toolChoice: false,
      showTopP: false,
      showStopSign: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek-v3.1',
      maxContext: 125000,
      maxTokens: 32000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek-v3.1-terminus',
      maxContext: 125000,
      maxTokens: 32000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek-v3.2-exp',
      maxContext: 125000,
      maxTokens: 32000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    }
  ]
};

export default models;
