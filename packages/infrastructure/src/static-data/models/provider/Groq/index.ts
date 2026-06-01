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
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'llama-3.3-70b-versatile',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    }
  ]
};

export default models;
