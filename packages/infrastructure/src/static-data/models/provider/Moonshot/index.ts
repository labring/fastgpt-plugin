import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Moonshot',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'kimi-k3',
      maxContext: 1048576,
      maxTokens: 1048576,
      quoteMaxToken: 1000000,
      maxTemperature: null,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      showTopP: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'kimi-k2.7-code',
      maxContext: 262144,
      maxTokens: 32768,
      quoteMaxToken: 256000,
      maxTemperature: null,
      responseFormatList: ['text', 'json_object'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      showTopP: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'kimi-k2.7-code-highspeed',
      maxContext: 262144,
      maxTokens: 32768,
      quoteMaxToken: 256000,
      maxTemperature: null,
      responseFormatList: ['text', 'json_object'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      showTopP: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'kimi-k2.6',
      maxContext: 262144,
      maxTokens: 32000,
      quoteMaxToken: 256000,
      maxTemperature: null,
      responseFormatList: ['text', 'json_object'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      showTopP: false
    }
  ]
};

export default models;
