import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'LLMTR',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'llmtr/qwen3-8-27b',
      maxContext: 262144,
      maxTokens: 262144,
      quoteMaxToken: 235000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'llmtr/gemma-4',
      maxContext: 131072,
      maxTokens: 131072,
      quoteMaxToken: 117000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'anthropic/claude-sonnet-4.6',
      maxContext: 1000000,
      maxTokens: 128000,
      quoteMaxToken: 900000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'anthropic/claude-haiku-4.5',
      maxContext: 200000,
      maxTokens: 64000,
      quoteMaxToken: 180000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'google/gemini-3.5-flash',
      maxContext: 1048576,
      maxTokens: 65536,
      quoteMaxToken: 943000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'openai/gpt-5.4-mini',
      maxContext: 128000,
      maxTokens: 128000,
      quoteMaxToken: 115000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      audio: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek/deepseek-v4-pro',
      maxContext: 1000000,
      maxTokens: 393216,
      quoteMaxToken: 900000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'minimax/minimax-m3.1-flash',
      maxContext: 1000000,
      maxTokens: 524288,
      quoteMaxToken: 900000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    }
  ]
};

export default models;
