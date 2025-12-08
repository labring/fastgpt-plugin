import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'ChatGLM',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4.6',
      maxContext: 200000,
      maxTokens: 130000,
      quoteMaxToken: 200000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4.6v',
      maxContext: 128000,
      maxTokens: 16000,
      quoteMaxToken: 200000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: true,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4.5',
      maxContext: 128000,
      maxTokens: 96000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4.5-x',
      maxContext: 128000,
      maxTokens: 96000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4.5-air',
      maxContext: 128000,
      maxTokens: 96000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4.5-airx',
      maxContext: 128000,
      maxTokens: 96000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4.5-flash',
      maxContext: 128000,
      maxTokens: 96000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4.1v-thinking-flashx',
      maxContext: 64000,
      maxTokens: 16000,
      quoteMaxToken: 64000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4.1v-thinking-flash',
      maxContext: 64000,
      maxTokens: 16000,
      quoteMaxToken: 64000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4-air',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 120000,
      maxTemperature: 0.99,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4-flash',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 120000,
      maxTemperature: 0.99,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4-long',
      maxContext: 1000000,
      maxTokens: 4000,
      quoteMaxToken: 900000,
      maxTemperature: 0.99,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4-plus',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 120000,
      maxTemperature: 0.99,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4v-flash',
      maxContext: 8000,
      maxTokens: 1000,
      quoteMaxToken: 6000,
      maxTemperature: 0.99,
      vision: true,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'glm-4v-plus',
      maxContext: 8000,
      maxTokens: 1000,
      quoteMaxToken: 6000,
      maxTemperature: 0.99,
      vision: true,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'embedding-3',
      defaultToken: 512,
      maxToken: 8000,
      defaultConfig: {
        dimensions: 1024
      }
    }
  ]
};

export default models;
