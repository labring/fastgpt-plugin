import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'AntLing',
  list: [
    // Ling series - general language models
    {
      type: ModelTypeEnum.llm,
      model: 'Ling-1T',
      maxContext: 128000,
      maxTokens: 16000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Ling-flash-2.0',
      maxContext: 128000,
      maxTokens: 16000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Ling-mini-2.0',
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

    // Ring series - reasoning models
    {
      type: ModelTypeEnum.llm,
      model: 'Ring-1T',
      maxContext: 128000,
      maxTokens: 16000,
      quoteMaxToken: 120000,
      maxTemperature: null,
      vision: false,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: false,
      showTopP: false,
      showStopSign: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Ring-flash-2.0',
      maxContext: 128000,
      maxTokens: 16000,
      quoteMaxToken: 120000,
      maxTemperature: null,
      vision: false,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: false,
      showTopP: false,
      showStopSign: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Ring-mini-2.0',
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
    },

    // Ming series - multimodal models
    {
      type: ModelTypeEnum.llm,
      model: 'Ming-flash-omni',
      maxContext: 128000,
      maxTokens: 16000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'Ming-lite-omni',
      maxContext: 64000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    }
  ]
};

export default models;
