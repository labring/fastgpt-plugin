import type { I18nStringStrictType } from '@domain/value-objects/i18n-string.vo';

export type ModelProviderMapType = {
  [key: string]: I18nStringStrictType;
};

export const ModelProviderMap = {
  OpenAI: {
    en: 'OpenAI',
    'zh-CN': 'OpenAI',
    'zh-Hant': 'OpenAI'
  },
  Claude: {
    en: 'Claude',
    'zh-CN': 'Claude',
    'zh-Hant': 'Claude'
  },
  Gemini: {
    en: 'Gemini',
    'zh-CN': 'Gemini',
    'zh-Hant': 'Gemini'
  },
  Meta: {
    en: 'Meta',
    'zh-CN': 'Meta',
    'zh-Hant': 'Meta'
  },
  MistralAI: {
    en: 'MistralAI',
    'zh-CN': 'MistralAI',
    'zh-Hant': 'MistralAI'
  },
  Grok: {
    en: 'Grok',
    'zh-CN': 'Grok',
    'zh-Hant': 'Grok'
  },
  Groq: {
    en: 'Groq',
    'zh-CN': 'Groq',
    'zh-Hant': 'Groq'
  },
  Jina: {
    en: 'Jina',
    'zh-CN': 'Jina',
    'zh-Hant': 'Jina'
  },
  Qwen: {
    en: 'Qwen',
    'zh-CN': '通义千问',
    'zh-Hant': '通義千問'
  },
  Doubao: {
    en: 'Doubao',
    'zh-CN': '豆包',
    'zh-Hant': '豆包'
  },
  DeepSeek: {
    en: 'DeepSeek',
    'zh-CN': '深度求索',
    'zh-Hant': '深度求索'
  },
  ChatGLM: {
    en: 'ChatGLM',
    'zh-CN': 'ChatGLM',
    'zh-Hant': 'ChatGLM'
  },
  MiniMax: {
    en: 'MiniMax',
    'zh-CN': 'MiniMax',
    'zh-Hant': 'MiniMax'
  },
  Moonshot: {
    en: 'Moonshot',
    'zh-CN': '月之暗面',
    'zh-Hant': '月之暗面'
  },
  Ernie: {
    en: 'Ernie',
    'zh-CN': '文心一言',
    'zh-Hant': '文心一言'
  },
  SparkDesk: {
    en: 'SparkDesk',
    'zh-CN': '讯飞星火',
    'zh-Hant': '訊飛星火'
  },
  Hunyuan: {
    en: 'Hunyuan',
    'zh-CN': '混元',
    'zh-Hant': '混元'
  },
  Baichuan: {
    en: 'Baichuan',
    'zh-CN': '百川智能',
    'zh-Hant': '百川智能'
  },
  StepFun: {
    en: 'StepFun',
    'zh-CN': '阶跃星辰',
    'zh-Hant': '階躍星辰'
  },
  ai360: {
    en: 'ai360',
    'zh-CN': 'ai360',
    'zh-Hant': 'ai360'
  },
  Yi: {
    en: 'Yi',
    'zh-CN': '零一万物',
    'zh-Hant': '零一萬物'
  },
  BAAI: {
    en: 'BAAI',
    'zh-CN': '北京智源',
    'zh-Hant': '北京智源'
  },
  FishAudio: {
    en: 'FishAudio',
    'zh-CN': 'FishAudio',
    'zh-Hant': 'FishAudio'
  },
  InternLM: {
    en: 'InternLM',
    'zh-CN': '书生大模型',
    'zh-Hant': '書生大模型'
  },
  Moka: {
    en: 'Moka',
    'zh-CN': 'Moka',
    'zh-Hant': 'Moka'
  },
  Ollama: {
    en: 'Ollama',
    'zh-CN': 'Ollama',
    'zh-Hant': 'Ollama'
  },
  OpenRouter: {
    en: 'OpenRouter',
    'zh-CN': 'OpenRouter',
    'zh-Hant': 'OpenRouter'
  },
  vertexai: {
    en: 'vertexai',
    'zh-CN': 'vertexai',
    'zh-Hant': 'vertexai'
  },
  novita: {
    en: 'novita',
    'zh-CN': 'novita',
    'zh-Hant': 'novita'
  },
  AliCloud: {
    en: 'AliCloud',
    'zh-CN': '阿里云',
    'zh-Hant': '阿里雲'
  },
  Siliconflow: {
    en: 'Siliconflow',
    'zh-CN': '硅基流动',
    'zh-Hant': '矽基流動'
  },
  PPIO: {
    en: 'PPIO',
    'zh-CN': 'PPIO',
    'zh-Hant': 'PPIO'
  },
  Sangfor: {
    en: 'Sangfor',
    'zh-CN': '深信服',
    'zh-Hant': '深信服'
  },
  Other: {
    en: 'Other',
    'zh-CN': '其他',
    'zh-Hant': '其他'
  }
} satisfies ModelProviderMapType;

// Unsorted version for SDK - no env dependency
export const ModelProviders: { provider: string; value: I18nStringStrictType }[] = Object.entries(
  ModelProviderMap
).map(([key, value]) => ({
  provider: key,
  value
}));

export type AiproxyMapProviderType = Record<
  number,
  {
    name: I18nStringStrictType;
    provider?: string; // Use to sort, get avatar
    avatar?: string;
  }
>;

export const aiproxyIdMap: AiproxyMapProviderType = {
  1: {
    name: {
      en: 'OpenAI',
      'zh-CN': 'OpenAI',
      'zh-Hant': 'OpenAI'
    },
    provider: 'OpenAI'
  },
  3: {
    name: {
      en: '微软 Azure',
      'zh-CN': 'Azure',
      'zh-Hant': 'Azure'
    },
    avatar: 'model/azure',
    provider: 'OpenAI'
  },
  4: {
    name: {
      en: 'Azure (deprecated)',
      'zh-CN': 'Azure（已弃用）',
      'zh-Hant': 'Azure（已弃用）'
    },
    avatar: 'model/azure',
    provider: 'Other'
  },
  14: {
    name: {
      en: 'Anthropic',
      'zh-CN': 'Anthropic',
      'zh-Hant': 'Anthropic'
    },
    provider: 'Claude'
  },
  12: {
    name: {
      en: 'Google Gemini(OpenAI)',
      'zh-CN': 'Google Gemini（OpenAI）',
      'zh-Hant': 'Google Gemini（OpenAI）'
    },
    provider: 'Gemini'
  },
  24: {
    name: {
      en: 'Google Gemini',
      'zh-CN': 'Google Gemini',
      'zh-Hant': 'Google Gemini'
    },
    provider: 'Gemini'
  },
  28: {
    name: {
      en: 'Mistral AI',
      'zh-CN': 'Mistral AI',
      'zh-Hant': 'Mistral AI'
    },
    provider: 'MistralAI'
  },
  29: {
    name: {
      en: 'Groq',
      'zh-CN': 'Groq',
      'zh-Hant': 'Groq'
    },
    provider: 'Groq'
  },
  17: {
    name: {
      en: 'Qwen',
      'zh-CN': '阿里百炼',
      'zh-Hant': '阿里百煉'
    },
    provider: 'Qwen'
  },
  40: {
    name: {
      en: 'Doubao',
      'zh-CN': '火山引擎（豆包）',
      'zh-Hant': '火山引擎（豆包）'
    },
    provider: 'Doubao'
  },
  36: {
    name: {
      en: 'DeepSeek',
      'zh-CN': 'DeepSeek',
      'zh-Hant': 'DeepSeek'
    },
    provider: 'DeepSeek'
  },
  13: {
    name: {
      en: 'Ernie V2',
      'zh-CN': '百度智能云 V2',
      'zh-Hant': '百度智能云 V2'
    },
    provider: 'Ernie'
  },
  15: {
    name: {
      en: 'Ernie',
      'zh-CN': '百度智能云',
      'zh-Hant': '百度智能云'
    },
    provider: 'Ernie'
  },
  16: {
    name: {
      en: 'ChatGLM',
      'zh-CN': '智谱清言',
      'zh-Hant': '智譜清言'
    },
    provider: 'ChatGLM'
  },
  18: {
    name: {
      en: 'SparkDesk',
      'zh-CN': '讯飞星火',
      'zh-Hant': '訊飛星火'
    },
    provider: 'SparkDesk'
  },
  25: {
    name: {
      en: 'Moonshot',
      'zh-CN': '月之暗面',
      'zh-Hant': '月之暗面'
    },
    provider: 'Moonshot'
  },
  26: {
    name: {
      en: 'Baichuan',
      'zh-CN': '百川智能',
      'zh-Hant': '百川智能'
    },
    provider: 'Baichuan'
  },
  27: {
    name: {
      en: 'MiniMax',
      'zh-CN': 'MiniMax',
      'zh-Hant': 'MiniMax'
    },
    provider: 'MiniMax'
  },
  31: {
    name: {
      en: 'Yi',
      'zh-CN': '零一万物',
      'zh-Hant': '零一萬物'
    },
    provider: 'Yi'
  },
  32: {
    name: {
      en: 'StepFun',
      'zh-CN': '阶跃星辰',
      'zh-Hant': '階躍星辰'
    },
    provider: 'StepFun'
  },
  43: {
    name: {
      en: 'Siliconflow',
      'zh-CN': '硅基流动',
      'zh-Hant': '矽基流動'
    },
    provider: 'Siliconflow'
  },
  30: {
    name: {
      en: 'Ollama',
      'zh-CN': 'Ollama',
      'zh-Hant': 'Ollama'
    },
    provider: 'Ollama'
  },
  23: {
    name: {
      en: 'Hunyuan',
      'zh-CN': '腾讯混元',
      'zh-Hant': '騰訊混元'
    },
    provider: 'Hunyuan'
  },
  44: {
    name: {
      en: 'Doubao Audio',
      'zh-CN': '火山引擎（豆包音频）',
      'zh-Hant': '火山引擎（豆包音频）'
    },
    provider: 'Doubao'
  },
  33: {
    name: {
      en: 'AWS',
      'zh-CN': 'AWS',
      'zh-Hant': 'AWS'
    },
    provider: 'Other',
    avatar: 'model/aws'
  },
  35: {
    name: {
      en: 'Cohere',
      'zh-CN': 'Cohere',
      'zh-Hant': 'Cohere'
    },
    provider: 'Other',
    avatar: 'model/cohere'
  },
  37: {
    name: {
      en: 'Cloudflare',
      'zh-CN': 'Cloudflare',
      'zh-Hant': 'Cloudflare'
    },
    provider: 'Other',
    avatar: 'model/cloudflare'
  },
  20: {
    name: {
      en: 'OpenRouter',
      'zh-CN': 'OpenRouter',
      'zh-Hant': 'OpenRouter'
    },
    provider: 'OpenRouter'
  },
  47: {
    name: {
      en: 'JinaAI',
      'zh-CN': 'JinaAI',
      'zh-Hant': 'JinaAI'
    },
    provider: 'Jina'
  },
  19: {
    name: {
      en: 'ai360',
      'zh-CN': 'ai360',
      'zh-Hant': 'ai360'
    },
    provider: 'ai360'
  },
  42: {
    name: {
      en: 'vertexai',
      'zh-CN': 'vertexai',
      'zh-Hant': 'vertexai'
    },
    provider: 'vertexai'
  },
  41: {
    name: {
      en: 'novita',
      'zh-CN': 'novita',
      'zh-Hant': 'novita'
    },
    provider: 'novita'
  },
  45: {
    name: {
      en: 'Grok',
      'zh-CN': 'Grok',
      'zh-Hant': 'Grok'
    },
    provider: 'Grok'
  },
  46: {
    name: {
      en: 'Doc2X',
      'zh-CN': 'Doc2X',
      'zh-Hant': 'Doc2X'
    },
    provider: 'Other',
    avatar: 'plugins/doc2x'
  },
  34: {
    name: {
      en: 'Coze',
      'zh-CN': '扣子',
      'zh-Hant': '扣子'
    },
    provider: 'Other',
    avatar: 'model/coze'
  },
  48: {
    name: {
      en: 'Sangfor',
      'zh-CN': '深信服',
      'zh-Hant': '深信服'
    },
    provider: 'Sangfor'
  }
};
