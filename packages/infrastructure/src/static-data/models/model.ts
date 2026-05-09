import type { I18nStringStrictType } from '@domain/value-objects/i18n-string.vo';

import type { AIProxyChannelsType } from './type';

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

export const aiproxyChannels: AIProxyChannelsType = [
  // 海外模型厂商 + 云厂商
  {
    channelId: 1,
    name: { en: 'OpenAI', 'zh-CN': 'OpenAI', 'zh-Hant': 'OpenAI' },
    avatar: 'openai'
  },
  {
    channelId: 14,
    name: { en: 'Anthropic', 'zh-CN': 'Anthropic', 'zh-Hant': 'Anthropic' },
    avatar: 'anthropic'
  },
  {
    channelId: 24,
    name: { en: 'Google Gemini', 'zh-CN': 'Google Gemini', 'zh-Hant': 'Google Gemini' },
    avatar: 'gemini'
  },
  {
    channelId: 28,
    name: { en: 'Mistral AI', 'zh-CN': 'Mistral AI', 'zh-Hant': 'Mistral AI' },
    avatar: 'mistralai'
  },
  { channelId: 45, name: { en: 'Grok', 'zh-CN': 'Grok', 'zh-Hant': 'Grok' }, avatar: 'grok' },

  {
    channelId: 3,
    name: { en: '微软 Azure', 'zh-CN': 'Azure', 'zh-Hant': 'Azure' },
    avatar: 'azure'
  },
  { channelId: 33, name: { en: 'AWS', 'zh-CN': 'AWS', 'zh-Hant': 'AWS' }, avatar: 'aws' },

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
  {
    channelId: 36,
    name: { en: 'DeepSeek', 'zh-CN': 'DeepSeek', 'zh-Hant': 'DeepSeek' },
    avatar: 'deepseek'
  },
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
  {
    channelId: 27,
    name: { en: 'MiniMax', 'zh-CN': 'MiniMax', 'zh-Hant': 'MiniMax' },
    avatar: 'minimax'
  },
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
  { channelId: 19, name: { en: 'ai360', 'zh-CN': 'ai360', 'zh-Hant': 'ai360' }, avatar: 'ai360' },
  {
    channelId: 43,
    name: { en: 'Siliconflow', 'zh-CN': '硅基流动', 'zh-Hant': '矽基流動' },
    avatar: 'siliconflow'
  },

  // 集成商
  {
    channelId: 20,
    name: { en: 'OpenRouter', 'zh-CN': 'OpenRouter', 'zh-Hant': 'OpenRouter' },
    avatar: 'openrouter'
  },
  { channelId: 29, name: { en: 'Groq', 'zh-CN': 'Groq', 'zh-Hant': 'Groq' }, avatar: 'groq' },
  { channelId: 47, name: { en: 'JinaAI', 'zh-CN': 'JinaAI', 'zh-Hant': 'JinaAI' }, avatar: 'jina' },
  {
    channelId: 35,
    name: { en: 'Cohere', 'zh-CN': 'Cohere', 'zh-Hant': 'Cohere' },
    avatar: 'cohere'
  },
  {
    channelId: 37,
    name: { en: 'Cloudflare', 'zh-CN': 'Cloudflare', 'zh-Hant': 'Cloudflare' },
    avatar: 'cloudflare'
  },
  {
    channelId: 42,
    name: { en: 'vertexai', 'zh-CN': 'vertexai', 'zh-Hant': 'vertexai' },
    avatar: 'vertexai'
  },
  {
    channelId: 41,
    name: { en: 'novita', 'zh-CN': 'novita', 'zh-Hant': 'novita' },
    avatar: 'novita'
  },
  {
    channelId: 30,
    name: { en: 'Ollama', 'zh-CN': 'Ollama', 'zh-Hant': 'Ollama' },
    avatar: 'ollama'
  },
  {
    channelId: 48,
    name: { en: 'Sangfor', 'zh-CN': 'Sangfor', 'zh-Hant': 'Sangfor' },
    avatar: 'sangfor'
  },

  // 三方 AI，非模型提供商
  { channelId: 46, name: { en: 'Doc2X', 'zh-CN': 'Doc2X', 'zh-Hant': 'Doc2X' }, avatar: 'doc2x' },
  { channelId: 34, name: { en: 'Coze', 'zh-CN': 'Coze', 'zh-Hant': 'Coze' }, avatar: 'coze' },
  // 弃用的
  {
    channelId: 12,
    name: {
      en: 'Google Gemini(OpenAI)',
      'zh-CN': 'Google Gemini(OpenAI)',
      'zh-Hant': 'Google Gemini(OpenAI)'
    },
    avatar: 'gemini-openai'
  },
  {
    channelId: 4,
    name: { en: 'azure (Deprecated)', 'zh-CN': 'azure (弃用)', 'zh-Hant': 'azure (棄用)' },
    avatar: 'azure-deprecated'
  },
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
