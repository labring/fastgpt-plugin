import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'Grok',
  list: [
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 200000, inputPrice: 14, outputPrice: 42 },
        { minInputTokens: 200000, inputPrice: 28, outputPrice: 84 }
      ],
      model: 'grok-4.5',
      maxContext: 500000,
      maxTokens: 8000,
      quoteMaxToken: 500000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 200000, inputPrice: 14, outputPrice: 42 },
        { minInputTokens: 200000, inputPrice: 28, outputPrice: 84 }
      ],
      model: 'grok-4.7',
      maxContext: 500000,
      maxTokens: 8000,
      quoteMaxToken: 500000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 200000, inputPrice: 14, outputPrice: 42 },
        { minInputTokens: 200000, inputPrice: 28, outputPrice: 84 }
      ],
      model: 'grok-4.6',
      maxContext: 500000,
      maxTokens: 8000,
      quoteMaxToken: 500000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 200000, inputPrice: 8.75, outputPrice: 17.5 },
        { minInputTokens: 200000, inputPrice: 17.5, outputPrice: 35 }
      ],
      model: 'grok-4.3',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 200000, inputPrice: 8.75, outputPrice: 17.5 },
        { minInputTokens: 200000, inputPrice: 17.5, outputPrice: 35 }
      ],
      model: 'grok-4.20',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 14, outputPrice: 70 }],
      model: 'grok-4.20-multi-agent-0309',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 14, outputPrice: 70 }],
      model: 'grok-4.20-0309-reasoning',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 14, outputPrice: 70 }],
      model: 'grok-4.20-0309-non-reasoning',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 1.4, outputPrice: 10.5 }],
      model: 'grok-code-fast-1',
      maxContext: 256000,
      maxTokens: 8000,
      quoteMaxToken: 200000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 200000, inputPrice: 7, outputPrice: 14 },
        { minInputTokens: 200000, inputPrice: 14, outputPrice: 28 }
      ],
      model: 'grok-build-0.1',
      maxContext: 256000,
      maxTokens: 8000,
      quoteMaxToken: 200000,
      maxTemperature: 1,
      vision: true,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    }
  ]
};

export default models;
