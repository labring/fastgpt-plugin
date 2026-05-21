import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'APIYI',
  list: [
    // ── LLM ──────────────────────────────────────────────────────────
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-5.4',
      maxContext: 128000,
      maxTokens: 16384,
      quoteMaxToken: 100000,
      maxTemperature: 2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-5.4-mini',
      maxContext: 128000,
      maxTokens: 16384,
      quoteMaxToken: 100000,
      maxTemperature: 2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-4.1-mini',
      maxContext: 1047576,
      maxTokens: 32768,
      quoteMaxToken: 200000,
      maxTemperature: 2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-opus-4-7',
      maxContext: 200000,
      maxTokens: 32000,
      quoteMaxToken: 150000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-sonnet-4-6',
      maxContext: 200000,
      maxTokens: 16000,
      quoteMaxToken: 150000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek-v3.2',
      maxContext: 65536,
      maxTokens: 8192,
      quoteMaxToken: 50000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek-reasoner',
      maxContext: 65536,
      maxTokens: 8192,
      quoteMaxToken: 50000,
      maxTemperature: 1,
      vision: false,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.5-pro',
      maxContext: 1048576,
      maxTokens: 65536,
      quoteMaxToken: 200000,
      maxTemperature: 2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.5-flash',
      maxContext: 1048576,
      maxTokens: 65536,
      quoteMaxToken: 200000,
      maxTemperature: 2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'qwen3-max',
      maxContext: 32768,
      maxTokens: 8192,
      quoteMaxToken: 25000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'kimi-k2-instruct',
      maxContext: 131072,
      maxTokens: 16384,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    // ── Embedding ────────────────────────────────────────────────────
    {
      type: ModelTypeEnum.embedding,
      model: 'text-embedding-3-large',
      defaultToken: 512,
      maxToken: 8192
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'text-embedding-3-small',
      defaultToken: 512,
      maxToken: 8192
    }
  ]
};

export default models;
