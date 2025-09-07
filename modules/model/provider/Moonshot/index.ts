import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Moonshot',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'kimi-k2-0905-preview	',
      maxContext: 256000,
      maxTokens: 32000,
      quoteMaxToken: 250000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'kimi-k2-0711-preview',
      maxContext: 128000,
      maxTokens: 32000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'kimi-latest-8k',
      maxContext: 8000,
      maxTokens: 4000,
      quoteMaxToken: 6000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'kimi-latest-32k',
      maxContext: 32000,
      maxTokens: 16000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'kimi-latest-128k',
      maxContext: 128000,
      maxTokens: 32000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'moonshot-v1-8k',
      maxContext: 8000,
      maxTokens: 4000,
      quoteMaxToken: 6000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'moonshot-v1-32k',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'moonshot-v1-128k',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 60000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'moonshot-v1-8k-vision-preview',
      maxContext: 8000,
      maxTokens: 4000,
      quoteMaxToken: 6000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'moonshot-v1-32k-vision-preview',
      maxContext: 32000,
      maxTokens: 4000,
      quoteMaxToken: 32000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'moonshot-v1-128k-vision-preview',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 60000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: true,
      reasoning: false,
      toolChoice: true
    }
  ]
};

export default models;
