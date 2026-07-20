import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Hunyuan',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-turbo-vision',
      maxContext: 6000,
      maxTokens: 2000,
      quoteMaxToken: 6000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-a13b',
      maxContext: 224000,
      maxTokens: 32000,
      quoteMaxToken: 224000,
      maxTemperature: 1,
      vision: false,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hy3',
      maxContext: 262144,
      maxTokens: 131072,
      quoteMaxToken: 196608,
      maxTemperature: null,
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      showTopP: false,
      showStopSign: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hy3-preview',
      maxContext: 262144,
      maxTokens: 131072,
      quoteMaxToken: 196608,
      maxTemperature: null,
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      showTopP: false,
      showStopSign: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'hunyuan-vision',
      maxContext: 6000,
      maxTokens: 2000,
      quoteMaxToken: 4000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'hunyuan-embedding',
      defaultToken: 512,
      maxToken: 1024
    }
  ]
};

export default models;
