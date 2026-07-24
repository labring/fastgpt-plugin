import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Qwen',
  list: [
    {
      type: ModelTypeEnum.rerank,
      model: 'qwen3-rerank',
      maxToken: 32000
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3.7-max',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3.8-max-preview',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3.7-plus',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3.6-plus',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3.6-flash',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3.5-flash',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3.5-plus',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3-vl-plus',
      maxContext: 25000,
      maxTokens: 8000,
      quoteMaxToken: 20000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: true,
      video: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen-max',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen-plus',
      maxContext: 1000000,
      maxTokens: 32000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen-flash',
      maxContext: 1000000,
      maxTokens: 32000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3-coder-flash',
      maxContext: 1024000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen-long',
      maxContext: 10000000,
      maxTokens: 6000,
      quoteMaxToken: 10000000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: false,
      datasetProcess: false,
      usedInClassify: false,
      usedInExtractFields: false,
      usedInToolCall: false,
      showTopP: false,
      showStopSign: false
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'text-embedding-v4',
      defaultToken: 512,
      maxToken: 8000,
      defaultConfig: {
        dimensions: 1536
      }
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'text-embedding-v3',
      defaultToken: 512,
      maxToken: 8000
    },
    {
      type: ModelTypeEnum.rerank,
      model: 'gte-rerank-v2',
      maxToken: 30000
    }
  ]
};

export default models;
