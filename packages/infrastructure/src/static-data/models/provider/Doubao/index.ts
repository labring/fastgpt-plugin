import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const doubaoTtsVoices = [
  { label: 'zh_female_kailangjiejie_moon_bigtts', value: 'zh_female_kailangjiejie_moon_bigtts' },
  { label: 'zh_female_tianmeitaozi_mars_bigtts', value: 'zh_female_tianmeitaozi_mars_bigtts' }
];

const models: ProviderConfigType = {
  provider: 'Doubao',
  list: [
    {
      type: ModelTypeEnum.llm,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 1.2, outputPrice: 3.6 }],
      model: 'doubao-seed-evolving',
      maxContext: 1024000,
      maxTokens: 256000,
      quoteMaxToken: 1024000,
      maxTemperature: 1,
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 0.8, outputPrice: 2 }],
      model: 'doubao-seed-2-1-pro-260628',
      maxContext: 256000,
      maxTokens: 256000,
      quoteMaxToken: 256000,
      maxTemperature: 1,
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 0.3, outputPrice: 0.6 }],
      model: 'doubao-seed-2-1-turbo-260628',
      maxContext: 256000,
      maxTokens: 256000,
      quoteMaxToken: 256000,
      maxTemperature: 1,
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 0.8, outputPrice: 2 }],
      model: 'doubao-seed-2-0-pro-260215',
      maxContext: 256000,
      maxTokens: 128000,
      quoteMaxToken: 224000,
      maxTemperature: 1,
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 0.3, outputPrice: 0.6 }],
      model: 'doubao-seed-2-0-lite-260428',
      maxContext: 256000,
      maxTokens: 128000,
      quoteMaxToken: 224000,
      maxTemperature: 1,
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 0.3, outputPrice: 0.6 }],
      model: 'doubao-seed-2-0-lite-260215',
      maxContext: 256000,
      maxTokens: 128000,
      quoteMaxToken: 224000,
      maxTemperature: 1,
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 0.1, outputPrice: 0.2 }],
      model: 'doubao-seed-2-0-mini-260428',
      maxContext: 256000,
      maxTokens: 128000,
      quoteMaxToken: 224000,
      maxTemperature: 1,
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 0.1, outputPrice: 0.2 }],
      model: 'doubao-seed-2-0-mini-260215',
      maxContext: 256000,
      maxTokens: 128000,
      quoteMaxToken: 224000,
      maxTemperature: 1,
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 0.8, outputPrice: 2 }],
      model: 'doubao-seed-1-8-251228',
      maxContext: 256000,
      maxTokens: 32000,
      quoteMaxToken: 224000,
      maxTemperature: 1,
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.embedding,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 0.2, outputPrice: 0 }],
      model: 'doubao-embedding-large-text-250515',
      defaultToken: 512,
      maxToken: 4096,
      vision: false,
      normalization: true
    },
    {
      type: ModelTypeEnum.embedding,
      priceCurrency: 'CNY',
      billingUnit: 'tokens_per_1m',
      priceTiers: [{ inputPrice: 0.1, outputPrice: 0 }],
      model: 'doubao-embedding-text-240715',
      defaultToken: 512,
      maxToken: 4096,
      vision: false,
      normalization: true
    },
    {
      type: ModelTypeEnum.tts,
      priceCurrency: 'CNY',
      billingUnit: 'characters_per_1m',
      priceTiers: [{ inputPrice: 50, outputPrice: 0 }],
      model: 'doubao-tts',
      voices: doubaoTtsVoices
    },
    {
      type: ModelTypeEnum.tts,
      priceCurrency: 'CNY',
      billingUnit: 'characters_per_1m',
      priceTiers: [{ inputPrice: 150, outputPrice: 0 }],
      model: 'seed-tts-2.0-standard',
      voices: doubaoTtsVoices
    },
    {
      type: ModelTypeEnum.tts,
      priceCurrency: 'CNY',
      billingUnit: 'characters_per_1m',
      priceTiers: [{ inputPrice: 250, outputPrice: 0 }],
      model: 'seed-tts-2.0-expressive',
      voices: doubaoTtsVoices
    }
  ]
};

export default models;
