import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'DeepSeek',
  list: [
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 2, outputPrice: 8 }],
      model: 'deepseek-flash',
      maxContext: 1000000,
      maxTokens: 384000,
      quoteMaxToken: 960000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },

    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 2, outputPrice: 8 }],
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
      priceTiers: [{ inputPrice: 9, outputPrice: 27 }],
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
      priceTiers: [{ inputPrice: 2, outputPrice: 8 }],
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
      priceTiers: [{ inputPrice: 4, outputPrice: 16 }],
      model: 'deepseek-reasoner',
      maxContext: 64000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
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
