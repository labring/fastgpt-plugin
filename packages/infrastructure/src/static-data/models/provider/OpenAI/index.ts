import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const ttsVoices = [
  {
    label: 'Alloy',
    value: 'alloy'
  },
  {
    label: 'Ash',
    value: 'ash'
  },
  {
    label: 'Ballad',
    value: 'ballad'
  },
  {
    label: 'Coral',
    value: 'coral'
  },
  {
    label: 'Echo',
    value: 'echo'
  },
  {
    label: 'Fable',
    value: 'fable'
  },
  {
    label: 'Nova',
    value: 'nova'
  },
  {
    label: 'Onyx',
    value: 'onyx'
  },
  {
    label: 'Sage',
    value: 'sage'
  },
  {
    label: 'Shimmer',
    value: 'shimmer'
  },
  {
    label: 'Verse',
    value: 'verse'
  },
  {
    label: 'Marin',
    value: 'marin'
  },
  {
    label: 'Cedar',
    value: 'cedar'
  }
];

const legacyTtsVoices = ttsVoices.filter(
  ({ value }) => !['ballad', 'verse', 'marin', 'cedar'].includes(value)
);

const models: ProviderConfigType = {
  provider: 'OpenAI',
  list: [
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 272000, inputPrice: 70, outputPrice: 350 },
        { minInputTokens: 272000, inputPrice: 140, outputPrice: 525 }
      ],
      model: 'gpt-6-astra',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 272000, inputPrice: 14, outputPrice: 70 },
        { minInputTokens: 272000, inputPrice: 28, outputPrice: 105 }
      ],
      model: 'gpt-6-sol',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 272000, inputPrice: 0.7, outputPrice: 3.5 },
        { minInputTokens: 272000, inputPrice: 1.4, outputPrice: 5.25 }
      ],
      model: 'gpt-6-luna',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 35, outputPrice: 175 }],
      model: 'gpt-5.6',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 272000, inputPrice: 14, outputPrice: 70 },
        { minInputTokens: 272000, inputPrice: 28, outputPrice: 105 }
      ],
      model: 'gpt-5.6-sol',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 272000, inputPrice: 14, outputPrice: 84 },
        { minInputTokens: 272000, inputPrice: 28, outputPrice: 126 }
      ],
      model: 'gpt-5.6-terra',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 272000, inputPrice: 1.4, outputPrice: 8.4 },
        { minInputTokens: 272000, inputPrice: 2.8, outputPrice: 12.6 }
      ],
      model: 'gpt-5.6-luna',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 272000, inputPrice: 35, outputPrice: 210 },
        { minInputTokens: 272000, inputPrice: 70, outputPrice: 315 }
      ],
      model: 'gpt-5.5',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 272000, inputPrice: 210, outputPrice: 1260 },
        { minInputTokens: 272000, inputPrice: 420, outputPrice: 1890 }
      ],
      model: 'gpt-5.5-pro',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      defaultConfig: {
        stream: false
      }
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 272000, inputPrice: 17.5, outputPrice: 105 },
        { minInputTokens: 272000, inputPrice: 35, outputPrice: 157.5 }
      ],
      model: 'gpt-5.4',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [
        { maxInputTokens: 272000, inputPrice: 210, outputPrice: 1260 },
        { minInputTokens: 272000, inputPrice: 420, outputPrice: 1890 }
      ],
      model: 'gpt-5.4-pro',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 5.25, outputPrice: 31.5 }],
      model: 'gpt-5.4-mini',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 1.4, outputPrice: 8.75 }],
      model: 'gpt-5.4-nano',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 12.25, outputPrice: 98 }],
      model: 'gpt-5.3-codex',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 12.25, outputPrice: 98 }],
      model: 'gpt-5.2',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 147, outputPrice: 1176 }],
      model: 'gpt-5.2-pro',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 35, outputPrice: 210 }],
      model: 'gpt-5.2-chat-latest',
      maxContext: 128000,
      maxTokens: 16384,
      quoteMaxToken: 128000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 8.75, outputPrice: 70 }],
      model: 'gpt-5.1',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 35, outputPrice: 210 }],
      model: 'gpt-5.1-chat-latest',
      maxContext: 128000,
      maxTokens: 16384,
      quoteMaxToken: 128000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 8.75, outputPrice: 70 }],
      model: 'gpt-5',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 105, outputPrice: 840 }],
      model: 'gpt-5-pro',
      maxContext: 400000,
      maxTokens: 272000,
      quoteMaxToken: 350000,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 35, outputPrice: 210 }],
      model: 'gpt-5-chat-latest',
      maxContext: 128000,
      maxTokens: 16384,
      quoteMaxToken: 128000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 1.75, outputPrice: 14 }],
      model: 'gpt-5-mini',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 0.35, outputPrice: 2.8 }],
      model: 'gpt-5-nano',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 140, outputPrice: 560 }],
      model: 'o3-pro',
      maxContext: 200000,
      maxTokens: 100000,
      quoteMaxToken: 120000,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      showStopSign: false,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 14, outputPrice: 56 }],
      model: 'gpt-4.1',
      maxContext: 1000000,
      maxTokens: 32000,
      quoteMaxToken: 1000000,
      maxTemperature: 1.2,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 2.8, outputPrice: 11.2 }],
      model: 'gpt-4.1-mini',
      maxContext: 1000000,
      maxTokens: 32000,
      quoteMaxToken: 1000000,
      maxTemperature: 1.2,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 0.7, outputPrice: 2.8 }],
      model: 'gpt-4.1-nano',
      maxContext: 1000000,
      maxTokens: 32000,
      quoteMaxToken: 1000000,
      maxTemperature: 1.2,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 1.05, outputPrice: 4.2 }],
      model: 'gpt-4o-mini',
      maxContext: 128000,
      maxTokens: 16000,
      quoteMaxToken: 60000,
      maxTemperature: 1.2,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 17.5, outputPrice: 70 }],
      model: 'gpt-4o',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 60000,
      maxTemperature: 1.2,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 7.7, outputPrice: 30.8 }],
      model: 'o4-mini',
      maxContext: 200000,
      maxTokens: 100000,
      quoteMaxToken: 120000,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      showStopSign: false,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 14, outputPrice: 56 }],
      model: 'o3',
      maxContext: 200000,
      maxTokens: 100000,
      quoteMaxToken: 120000,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      showStopSign: false,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 7.7, outputPrice: 30.8 }],
      model: 'o3-mini',
      maxContext: 200000,
      maxTokens: 100000,
      quoteMaxToken: 120000,
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      showStopSign: false,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 1050, outputPrice: 4200 }],
      model: 'o1-pro',
      maxContext: 200000,
      maxTokens: 100000,
      quoteMaxToken: 120000,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      showStopSign: false,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 105, outputPrice: 420 }],
      model: 'o1',
      maxContext: 200000,
      maxTokens: 100000,
      quoteMaxToken: 120000,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      showStopSign: false,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 0.259, outputPrice: 1.19 }],
      model: 'gpt-oss-120b',
      maxContext: 131000,
      maxTokens: 131000,
      quoteMaxToken: 100000,
      maxTemperature: 2,
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      showStopSign: true,
      responseFormatList: ['text', 'json_object', 'json_schema']
    },
    {
      type: ModelTypeEnum.llm,
      priceTiers: [{ inputPrice: 0.126, outputPrice: 0.63 }],
      model: 'gpt-oss-20b',
      maxContext: 131000,
      maxTokens: 131000,
      quoteMaxToken: 100000,
      maxTemperature: 2,
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      showStopSign: true,
      responseFormatList: ['text', 'json_object', 'json_schema']
    },
    {
      type: ModelTypeEnum.embedding,
      priceTiers: [{ inputPrice: 0.91, outputPrice: 0 }],
      model: 'text-embedding-3-large',
      defaultToken: 512,
      maxToken: 8000,
      vision: false
    },
    {
      type: ModelTypeEnum.embedding,
      priceTiers: [{ inputPrice: 0.14, outputPrice: 0 }],
      model: 'text-embedding-3-small',
      defaultToken: 512,
      maxToken: 8000,
      vision: false
    },
    {
      type: ModelTypeEnum.embedding,
      priceTiers: [{ inputPrice: 0.7, outputPrice: 0 }],
      model: 'text-embedding-ada-002',
      defaultToken: 512,
      maxToken: 8000,
      vision: false
    },
    {
      type: ModelTypeEnum.tts,
      priceTiers: [{ inputPrice: 105, outputPrice: 0 }],
      model: 'tts-1',
      voices: legacyTtsVoices
    },
    {
      type: ModelTypeEnum.tts,
      priceTiers: [{ inputPrice: 210, outputPrice: 0 }],
      model: 'tts-1-hd',
      voices: legacyTtsVoices
    },
    {
      type: ModelTypeEnum.stt,
      priceTiers: [{ inputPrice: 0.042, outputPrice: 0 }],
      model: 'whisper-1'
    }
  ]
};

export default models;
