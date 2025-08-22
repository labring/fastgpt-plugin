import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Qwen',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'qwen-max',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen-vl-max',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen-plus',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen-vl-plus',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen-turbo',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3-235b-a22b',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      toolChoice: true,
      defaultConfig: {
        stream: true
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3-32b',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      toolChoice: true,
      defaultConfig: {
        stream: true
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3-30b-a3b',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      toolChoice: true,
      defaultConfig: {
        stream: true
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3-14b',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      toolChoice: true,
      defaultConfig: {
        stream: true
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3-8b',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      toolChoice: true,
      defaultConfig: {
        stream: true
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3-4b',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      toolChoice: true,
      defaultConfig: {
        stream: true
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3-1.7b',
      maxContext: 32000,
      maxTokens: 8000,
      quoteMaxToken: 30000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      toolChoice: true,
      defaultConfig: {
        stream: true
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3-0.6b',
      maxContext: 32000,
      maxTokens: 8000,
      quoteMaxToken: 30000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: true,
      toolChoice: true,
      defaultConfig: {
        stream: true
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwq-plus',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: null,
      vision: false,
      reasoning: true,
      toolChoice: true,
      datasetProcess: false,
      usedInClassify: false,
      usedInExtractFields: false,
      showTopP: false,
      showStopSign: false,
      defaultConfig: {
        stream: true
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwq-32b',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: null,
      vision: false,
      reasoning: true,
      toolChoice: true,
      datasetProcess: false,
      usedInClassify: false,
      usedInExtractFields: false,
      showTopP: false,
      showStopSign: false,
      defaultConfig: {
        stream: true
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen-coder-turbo',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 50000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen2.5-7b-instruct',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 50000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen2.5-14b-instruct',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 50000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen2.5-32b-instruct',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 50000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen2.5-72b-instruct',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 50000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen-long',
      maxContext: 10000000,
      maxTokens: 6000,
      quoteMaxToken: 10000000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
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
      model: 'gte-rerank-v2'
    }
  ]
};

export default models;
