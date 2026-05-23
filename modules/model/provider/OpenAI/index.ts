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
      model: 'gpt-5.5',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      maxTemperature: null,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-5.5-pro',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      maxTemperature: null,
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
      model: 'gpt-5.4',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      maxTemperature: null,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-5.4-pro',
      maxContext: 1050000,
      maxTokens: 128000,
      quoteMaxToken: 1000000,
      maxTemperature: null,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-5.4-mini',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      maxTemperature: null,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-5.4-nano',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      maxTemperature: null,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-5.2',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      maxTemperature: null,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-5.1',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      maxTemperature: null,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-5.1-chat-latest',
      maxContext: 128000,
      maxTokens: 16000,
      quoteMaxToken: 128000,
      maxTemperature: null,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-5',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      maxTemperature: null,
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
      model: 'gpt-5-mini',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      maxTemperature: null,
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
      model: 'gpt-5-nano',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 350000,
      maxTemperature: null,
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
      model: 'gpt-5-chat',
      maxContext: 128000,
      maxTokens: 16000,
      quoteMaxToken: 128000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
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
      model: 'o4-mini',
      maxContext: 200000,
      maxTokens: 100000,
      quoteMaxToken: 120000,
      maxTemperature: null,
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
      model: 'o3',
      maxContext: 200000,
      maxTokens: 100000,
      quoteMaxToken: 120000,
      maxTemperature: null,
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
      model: 'o3-mini',
      maxContext: 200000,
      maxTokens: 100000,
      quoteMaxToken: 120000,
      maxTemperature: null,
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
      model: 'text-embedding-3-large',
      defaultToken: 512,
      maxToken: 8000
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'text-embedding-3-small',
      defaultToken: 512,
      maxToken: 8000
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'text-embedding-ada-002',
      defaultToken: 512,
      maxToken: 8000
    },
    {
      type: ModelTypeEnum.tts,
      model: 'tts-1',
      voices: legacyTtsVoices
    },
    {
      type: ModelTypeEnum.tts,
      model: 'tts-1-hd',
      voices: legacyTtsVoices
    },
    {
      type: ModelTypeEnum.stt,
      model: 'whisper-1'
    }
  ]
};

export default models;
