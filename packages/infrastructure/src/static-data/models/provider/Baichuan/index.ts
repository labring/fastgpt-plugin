import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Baichuan',
  list: [
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 100, outputPrice: 100 }],
      model: 'Baichuan4',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 30000,
      maxTemperature: 1.2,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 15, outputPrice: 15 }],
      model: 'Baichuan4-Turbo',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 30000,
      maxTemperature: 1.2,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 0.98, outputPrice: 0.98 }],
      model: 'Baichuan4-Air',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 30000,
      maxTemperature: 1.2,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 12, outputPrice: 12 }],
      model: 'Baichuan3-Turbo-128k',
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
      priceTiers: [{ inputPrice: 12, outputPrice: 12 }],
      model: 'Baichuan3-Turbo',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 30000,
      maxTemperature: 1.2,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 15, outputPrice: 15 }],
      model: 'Baichuan-M2',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 30000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true,
      responseFormatList: ['text', 'json_object']
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 15, outputPrice: 15 }],
      model: 'Baichuan-M2-Plus',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 30000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true,
      responseFormatList: ['text', 'json_object']
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 30, outputPrice: 30 }],
      model: 'Baichuan-M3',
      maxContext: 32000,
      maxTokens: 5000,
      quoteMaxToken: 30000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 30, outputPrice: 30 }],
      model: 'Baichuan-M3-Plus',
      maxContext: 32000,
      maxTokens: 5000,
      quoteMaxToken: 30000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 8, outputPrice: 8 }],
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
