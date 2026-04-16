// SDK-safe constants - no env dependency, can be used in client bundles
import type { I18nStringStrictType } from '@/validates/i18n';

export type ModelProviderMap = {
  [key: string]: I18nStringStrictType;
};

export type ModelProviderItem = {
  provider: string;
  value: I18nStringStrictType;
};

export const ModelProviders: ModelProviderItem[] = [
  // 海外模型厂商
  {
    provider: 'OpenAI',
    value: {
      en: 'OpenAI',
      'zh-CN': 'OpenAI',
      'zh-Hant': 'OpenAI'
    }
  },
  {
    provider: 'Claude',
    value: {
      en: 'Claude',
      'zh-CN': 'Claude',
      'zh-Hant': 'Claude'
    }
  },
  {
    provider: 'Gemini',
    value: {
      en: 'Gemini',
      'zh-CN': 'Gemini',
      'zh-Hant': 'Gemini'
    }
  },
  {
    provider: 'Grok',
    value: {
      en: 'Grok',
      'zh-CN': 'Grok',
      'zh-Hant': 'Grok'
    }
  },
  {
    provider: 'Meta',
    value: {
      en: 'Meta',
      'zh-CN': 'Meta',
      'zh-Hant': 'Meta'
    }
  },
  {
    provider: 'MistralAI',
    value: {
      en: 'MistralAI',
      'zh-CN': 'MistralAI',
      'zh-Hant': 'MistralAI'
    }
  },

  // 国内模型厂商
  {
    provider: 'Qwen',
    value: {
      en: 'Qwen',
      'zh-CN': '通义千问',
      'zh-Hant': '通義千問'
    }
  },
  {
    provider: 'Doubao',
    value: {
      en: 'Doubao',
      'zh-CN': '豆包',
      'zh-Hant': '豆包'
    }
  },
  {
    provider: 'DeepSeek',
    value: {
      en: 'DeepSeek',
      'zh-CN': '深度求索',
      'zh-Hant': '深度求索'
    }
  },
  {
    provider: 'ChatGLM',
    value: {
      en: 'ChatGLM',
      'zh-CN': 'ChatGLM',
      'zh-Hant': 'ChatGLM'
    }
  },
  {
    provider: 'MiniMax',
    value: {
      en: 'MiniMax',
      'zh-CN': 'MiniMax',
      'zh-Hant': 'MiniMax'
    }
  },
  {
    provider: 'Moonshot',
    value: {
      en: 'Moonshot',
      'zh-CN': '月之暗面',
      'zh-Hant': '月之暗面'
    }
  },
  {
    provider: 'Ernie',
    value: {
      en: 'Ernie',
      'zh-CN': '文心一言',
      'zh-Hant': '文心一言'
    }
  },
  {
    provider: 'SparkDesk',
    value: {
      en: 'SparkDesk',
      'zh-CN': '讯飞星火',
      'zh-Hant': '訊飛星火'
    }
  },
  {
    provider: 'Hunyuan',
    value: {
      en: 'Hunyuan',
      'zh-CN': '混元',
      'zh-Hant': '混元'
    }
  },
  {
    provider: 'AntLing',
    value: {
      en: 'Ant Ling',
      'zh-CN': '蚂蚁百灵',
      'zh-Hant': '螞蟻百靈'
    }
  },
  {
    provider: 'Baichuan',
    value: {
      en: 'Baichuan',
      'zh-CN': '百川智能',
      'zh-Hant': '百川智能'
    }
  },
  {
    provider: 'StepFun',
    value: {
      en: 'StepFun',
      'zh-CN': '阶跃星辰',
      'zh-Hant': '階躍星辰'
    }
  },
  {
    provider: 'ai360',
    value: {
      en: 'ai360',
      'zh-CN': 'ai360',
      'zh-Hant': 'ai360'
    }
  },
  {
    provider: 'Yi',
    value: {
      en: 'Yi',
      'zh-CN': '零一万物',
      'zh-Hant': '零一萬物'
    }
  },

  // 海外集成商
  {
    provider: 'OpenRouter',
    value: {
      en: 'OpenRouter',
      'zh-CN': 'OpenRouter',
      'zh-Hant': 'OpenRouter'
    }
  },
  {
    provider: 'Ollama',
    value: {
      en: 'Ollama',
      'zh-CN': 'Ollama',
      'zh-Hant': 'Ollama'
    }
  },
  {
    provider: 'Groq',
    value: {
      en: 'Groq',
      'zh-CN': 'Groq',
      'zh-Hant': 'Groq'
    }
  },
  {
    provider: 'Jina',
    value: {
      en: 'Jina',
      'zh-CN': 'Jina',
      'zh-Hant': 'Jina'
    }
  },
  {
    provider: 'vertexai',
    value: {
      en: 'vertexai',
      'zh-CN': 'vertexai',
      'zh-Hant': 'vertexai'
    }
  },
  {
    provider: 'novita',
    value: {
      en: 'novita',
      'zh-CN': 'novita',
      'zh-Hant': 'novita'
    }
  },

  // 国内集成商
  {
    provider: 'Siliconflow',
    value: {
      en: 'Siliconflow',
      'zh-CN': '硅基流动',
      'zh-Hant': '矽基流動'
    }
  },
  {
    provider: 'BAAI',
    value: {
      en: 'BAAI',
      'zh-CN': '北京智源',
      'zh-Hant': '北京智源'
    }
  },
  {
    provider: 'FishAudio',
    value: {
      en: 'FishAudio',
      'zh-CN': 'FishAudio',
      'zh-Hant': 'FishAudio'
    }
  },
  {
    provider: 'InternLM',
    value: {
      en: 'InternLM',
      'zh-CN': '书生大模型',
      'zh-Hant': '書生大模型'
    }
  },
  {
    provider: 'Moka',
    value: {
      en: 'Moka',
      'zh-CN': 'Moka',
      'zh-Hant': 'Moka'
    }
  },
  {
    provider: 'AliCloud',
    value: {
      en: 'AliCloud',
      'zh-CN': '阿里云',
      'zh-Hant': '阿里雲'
    }
  },
  {
    provider: 'PPIO',
    value: {
      en: 'PPIO',
      'zh-CN': 'PPIO',
      'zh-Hant': 'PPIO'
    }
  },
  {
    provider: 'Sangfor',
    value: {
      en: 'Sangfor',
      'zh-CN': '深信服',
      'zh-Hant': '深信服'
    }
  },

  {
    provider: 'Other',
    value: {
      en: 'Other',
      'zh-CN': '其他',
      'zh-Hant': '其他'
    }
  }
];

export const ModelProviderMap: ModelProviderMap = Object.fromEntries(
  ModelProviders.map(({ provider, value }) => [provider, value])
);

export type AIProxyChannelsType = {
  channelId: number;
  name: I18nStringStrictType | string;
  avatar: string;
}[];

export const aiproxyChannels: AIProxyChannelsType = [
  // 海外模型厂商 + 云厂商
  { channelId: 1, name: 'OpenAI', avatar: 'openai' },
  { channelId: 14, name: 'Anthropic', avatar: 'anthropic' },
  { channelId: 24, name: 'Google Gemini', avatar: 'gemini' },
  { channelId: 28, name: 'Mistral AI', avatar: 'mistralai' },
  { channelId: 45, name: 'Grok', avatar: 'grok' },

  {
    channelId: 3,
    name: { en: '微软 Azure', 'zh-CN': 'Azure', 'zh-Hant': 'Azure' },
    avatar: 'azure'
  },
  { channelId: 33, name: 'AWS', avatar: 'aws' },

  // 国内厂商 + 云厂商
  {
    channelId: 17,
    name: { en: 'Qwen', 'zh-CN': '阿里百炼', 'zh-Hant': '阿里百煉' },
    avatar: 'qwen'
  },
  {
    channelId: 40,
    name: { en: 'Doubao', 'zh-CN': '火山引擎（豆包）', 'zh-Hant': '火山引擎（豆包）' },
    avatar: 'doubao'
  },
  {
    channelId: 25,
    name: { en: 'Moonshot', 'zh-CN': '月之暗面', 'zh-Hant': '月之暗面' },
    avatar: 'moonshot'
  },
  { channelId: 36, name: 'DeepSeek', avatar: 'deepseek' },
  {
    channelId: 23,
    name: { en: 'Hunyuan', 'zh-CN': '腾讯混元', 'zh-Hant': '騰訊混元' },
    avatar: 'hunyuan'
  },
  {
    channelId: 13,
    name: { en: 'Ernie V2', 'zh-CN': '百度智能云 V2', 'zh-Hant': '百度智能云 V2' },
    avatar: 'ernie-v2'
  },
  {
    channelId: 16,
    name: { en: 'ChatGLM', 'zh-CN': '智谱清言', 'zh-Hant': '智譜清言' },
    avatar: 'chatglm'
  },
  {
    channelId: 18,
    name: { en: 'SparkDesk', 'zh-CN': '讯飞星火', 'zh-Hant': '訊飛星火' },
    avatar: 'sparkdesk'
  },
  {
    channelId: 54,
    name: { en: 'Ant Ling', 'zh-CN': '蚂蚁百灵', 'zh-Hant': '螞蟻百靈' },
    avatar: 'antling'
  },
  {
    channelId: 26,
    name: { en: 'Baichuan', 'zh-CN': '百川智能', 'zh-Hant': '百川智能' },
    avatar: 'baichuan'
  },
  { channelId: 27, name: 'MiniMax', avatar: 'minimax' },
  {
    channelId: 31,
    name: { en: 'Yi', 'zh-CN': '零一万物', 'zh-Hant': '零一萬物' },
    avatar: 'yi'
  },
  {
    channelId: 32,
    name: { en: 'StepFun', 'zh-CN': '阶跃星辰', 'zh-Hant': '階躍星辰' },
    avatar: 'stepfun'
  },
  { channelId: 19, name: 'ai360', avatar: 'ai360' },
  {
    channelId: 43,
    name: { en: 'Siliconflow', 'zh-CN': '硅基流动', 'zh-Hant': '矽基流動' },
    avatar: 'siliconflow'
  },

  // 集成商
  { channelId: 20, name: 'OpenRouter', avatar: 'openrouter' },
  { channelId: 29, name: 'Groq', avatar: 'groq' },
  { channelId: 47, name: 'JinaAI', avatar: 'jina' },
  { channelId: 35, name: 'Cohere', avatar: 'cohere' },
  { channelId: 37, name: 'Cloudflare', avatar: 'cloudflare' },
  { channelId: 42, name: 'vertexai', avatar: 'vertexai' },
  { channelId: 41, name: 'novita', avatar: 'novita' },
  { channelId: 30, name: 'Ollama', avatar: 'ollama' },
  { channelId: 48, name: 'Sangfor', avatar: 'sangfor' },

  // 三方 AI，非模型提供商
  { channelId: 46, name: 'Doc2X', avatar: 'doc2x' },
  { channelId: 34, name: 'Coze', avatar: 'coze' },
  // 弃用的
  { channelId: 12, name: 'Google Gemini(OpenAI)', avatar: 'gemini-openai' },
  { channelId: 4, name: `azure (弃用)`, avatar: 'azure-deprecated' },
  {
    channelId: 15,
    name: { en: 'Ernie', 'zh-CN': '百度智能云', 'zh-Hant': '百度智能云' },
    avatar: 'ernie'
  },
  {
    channelId: 44,
    name: {
      en: 'Doubao Audio',
      'zh-CN': '火山引擎（豆包音频）',
      'zh-Hant': '火山引擎（豆包音频）'
    },
    avatar: 'doubao-audio'
  }
];
