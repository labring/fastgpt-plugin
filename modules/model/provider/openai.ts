import { ModelTypeEnum, type ProviderConfigType } from '../type';

const models: ProviderConfigType = {
  provider: 'OpenAI',
  list: [
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
      toolChoice: true,
      showStopSign: false,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'o1',
      maxContext: 195000,
      maxTokens: 8000,
      quoteMaxToken: 120000,
      maxTemperature: null,
      vision: true,
      reasoning: true,
      toolChoice: false,
      showStopSign: false,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'o1-mini',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 120000,
      maxTemperature: null,
      vision: false,
      reasoning: true,
      toolChoice: false,
      showStopSign: true,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'o1-preview',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 120000,
      maxTemperature: null,
      vision: false,
      reasoning: true,
      toolChoice: false,
      showStopSign: true,
      defaultConfig: {
        stream: false
      },
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-3.5-turbo',
      maxContext: 16000,
      maxTokens: 4000,
      quoteMaxToken: 13000,
      maxTemperature: 1.2,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-4-turbo',
      maxContext: 128000,
      maxTokens: 4000,
      quoteMaxToken: 60000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
      toolChoice: true
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
      voices: [
        {
          label: 'Alloy',
          value: 'alloy'
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
          label: 'Onyx',
          value: 'onyx'
        },
        {
          label: 'Nova',
          value: 'nova'
        },
        {
          label: 'Shimmer',
          value: 'shimmer'
        }
      ]
    },
    {
      type: ModelTypeEnum.stt,
      model: 'whisper-1'
    }
  ]
};

export default models;
