import { ModelTypeEnum, type ProviderConfigType } from '../../type';

const models: ProviderConfigType = {
  provider: 'DeerAPI',
  list: [
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-5',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 400000,
      maxTemperature: null,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: false,
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
      quoteMaxToken: 400000,
      maxTemperature: null,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: false,
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
      quoteMaxToken: 400000,
      maxTemperature: null,
      responseFormatList: ['text', 'json_schema'],
      vision: true,
      reasoning: false,
      toolChoice: true,
      fieldMap: {
        max_tokens: 'max_completion_tokens'
      }
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gpt-5-chat',
      maxContext: 400000,
      maxTokens: 128000,
      quoteMaxToken: 400000,
      maxTemperature: 1.2,
      vision: true,
      reasoning: false,
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
      model: 'o3-pro',
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
      model: 'gpt-oss-120b',
      maxContext: 131000,
      maxTokens: 131000,
      quoteMaxToken: 100000,
      maxTemperature: 2,
      vision: false,
      reasoning: false,
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
      reasoning: false,
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
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-opus-4-1-20250805',
      maxContext: 200000,
      maxTokens: 4096,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-opus-4-20250514',
      maxContext: 200000,
      maxTokens: 4096,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-opus-4-20250514',
      maxContext: 200000,
      maxTokens: 4096,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-3-7-sonnet-20250219',
      maxContext: 200000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'claude-3-5-haiku-20241022',
      maxContext: 200000,
      maxTokens: 8000,
      quoteMaxToken: 100000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.embedding,
      model: 'text-embedding-004',
      defaultToken: 512,
      maxToken: 2000
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.5-pro',
      maxContext: 1000000,
      maxTokens: 63000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.5-flash',
      maxContext: 1000000,
      maxTokens: 63000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.5-pro-exp-03-25',
      maxContext: 1000000,
      maxTokens: 63000,
      quoteMaxToken: 1000000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.5-flash-preview-04-17',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'gemini-2.0-flash',
      maxContext: 1000000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek-chat',
      maxContext: 64000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek-reasoner',
      maxContext: 64000,
      maxTokens: 8000,
      quoteMaxToken: 60000,
      maxTemperature: null,
      vision: false,
      reasoning: true,
      toolChoice: false,
      showTopP: false,
      showStopSign: false
    },
    {
      type: ModelTypeEnum.llm,
      model: 'deepseek-v3.1',
      maxContext: 125000,
      maxTokens: 32000,
      quoteMaxToken: 120000,
      maxTemperature: 1,
      responseFormatList: ['text', 'json_object'],
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-4',
      maxContext: 256000,
      maxTokens: 8000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-4-0709',
      maxContext: 256000,
      maxTokens: 8000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: true,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-3-mini',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-3-mini-fast',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-3',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    },
    {
      type: ModelTypeEnum.llm,
      model: 'grok-3-fast',
      maxContext: 128000,
      maxTokens: 8000,
      quoteMaxToken: 128000,
      maxTemperature: 1,
      vision: false,
      reasoning: false,
      toolChoice: true
    }
  ]
};

export default models;
