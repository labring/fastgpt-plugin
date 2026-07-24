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
      model: 'minimaxai/minimax-m2.7',
      maxContext: 196608,
      maxTokens: 131072,
      quoteMaxToken: 190000,
      maxTemperature: 1,
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      responseFormatList: ['text', 'json_object']
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
      model: 'qwen/qwen3.6-27b',
      maxContext: 131072,
      maxTokens: 16384,
      quoteMaxToken: 120000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      responseFormatList: ['text', 'json_object']
    },
    {
      type: ModelTypeEnum.stt,
      model: 'whisper-large-v3'
    },
    {
      type: ModelTypeEnum.stt,
      model: 'whisper-large-v3-turbo'
    }
  ]
};

export default models;
