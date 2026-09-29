import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Gemini',
  list: [
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 5.25, outputPrice: 26.25 }],
      model: 'gemini-3.8-flash',
      maxContext: 1048576,
      maxTokens: 65536,
      quoteMaxToken: 1000000,
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 5.25, outputPrice: 26.25 }],
      model: 'gemini-3.7-flash',
      maxContext: 1048576,
      maxTokens: 65536,
      quoteMaxToken: 1000000,
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 5.25, outputPrice: 26.25 }],
      model: 'gemini-3.6-flash',
      maxContext: 1048576,
      maxTokens: 65536,
      quoteMaxToken: 1000000,
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 10.5, outputPrice: 63 }],
      model: 'gemini-3.5-flash',
      maxContext: 1048576,
      maxTokens: 65536,
      quoteMaxToken: 1000000,
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 200000, inputPrice: 14, outputPrice: 84 },
        { minInputTokens: 200000, inputPrice: 28, outputPrice: 126 }
      ],
      model: 'gemini-3.1-pro-preview-customtools',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 1.75, outputPrice: 10.5 }],
      model: 'gemini-3.1-flash-lite',
      maxContext: 1048576,
      maxTokens: 65536,
      quoteMaxToken: 1000000,
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 2.1, outputPrice: 17.5 }],
      model: 'gemini-3.5-flash-lite',
      maxContext: 1048576,
      maxTokens: 65536,
      quoteMaxToken: 1000000,
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 200000, inputPrice: 14, outputPrice: 84 },
        { minInputTokens: 200000, inputPrice: 28, outputPrice: 126 }
      ],
      model: 'gemini-3.1-pro',
      maxContext: 1000000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 3.5, outputPrice: 21 }],
      model: 'gemini-3-flash',
      maxContext: 1024000,
      maxTokens: 64000,
      quoteMaxToken: 1000000,
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 200000, inputPrice: 8.75, outputPrice: 70 },
        { minInputTokens: 200000, inputPrice: 17.5, outputPrice: 105 }
      ],
      model: 'gemini-2.5-pro',
      maxContext: 1000000,
      maxTokens: 63000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      audio: true,
      video: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 2.1, outputPrice: 17.5 }],
      model: 'gemini-2.5-flash',
      maxContext: 1000000,
      maxTokens: 63000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      audio: true,
      video: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 0.7, outputPrice: 2.8 }],
      model: 'gemini-2.5-flash-lite',
      maxContext: 1000000,
      maxTokens: 63000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      audio: true,
      video: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },

    {
      type: ModelTypeEnum.embedding,
      priceTiers: [{ inputPrice: 0.175, outputPrice: 0 }],
      model: 'gemini-embedding-001',
      defaultToken: 512,
      maxToken: 2048,
      vision: false
    },
    {
      type: ModelTypeEnum.embedding,
      priceTiers: [{ inputPrice: 1.4, outputPrice: 0 }],
      model: 'gemini-embedding-2',
      defaultToken: 512,
      maxToken: 8192,
      vision: true
    }
  ]
};

export default models;
