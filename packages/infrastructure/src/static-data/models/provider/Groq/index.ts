import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Groq',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'openai/gpt-oss-120b',
      maxContext: 131072,
      maxTokens: 65536,
      quoteMaxToken: 120000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'openai/gpt-oss-20b',
      maxContext: 131072,
      maxTokens: 65536,
      quoteMaxToken: 120000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen/qwen3-32b',
      maxContext: 131072,
      maxTokens: 40960,
      quoteMaxToken: 120000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen/qwen3.6-27b',
      maxContext: 131072,
      maxTokens: 32768,
      quoteMaxToken: 120000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.stt,
      model: 'whisper-large-v3'
    },
    {
      type: ModelTypeEnum.stt,
      model: 'whisper-large-v3-turbo'
    },
    {
      type: ModelTypeEnum.llm,
      model: 'llama-3.1-8b-instant',
      maxContext: 131072,
      maxTokens: 131072,
      quoteMaxToken: 120000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'llama-3.3-70b-versatile',
      maxContext: 131072,
      maxTokens: 32768,
      quoteMaxToken: 120000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      maxContext: 131072,
      maxTokens: 8192,
      quoteMaxToken: 120000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    }
  ]
};

export default models;
