import { z } from 'zod';

export const ToolTagEnum = z.enum([
  'tools',
  'search',
  'multimodal',
  'communication',
  'finance',
  'design',
  'productivity',
  'news',
  'entertainment',
  'social',
  'scientific',
  'other'
]);

export const ToolTagsNameMap = {
  [ToolTagEnum.enum.tools]: {
    en: 'tools',
    'zh-CN': '工具',
    'zh-Hant': '工具'
  },
  [ToolTagEnum.enum.search]: {
    en: 'search',
    'zh-CN': '搜索',
    'zh-Hant': '搜尋'
  },
  [ToolTagEnum.enum.multimodal]: {
    en: 'multimodal',
    'zh-CN': '多模态',
    'zh-Hant': '多模態'
  },
  [ToolTagEnum.enum.communication]: {
    en: 'communication',
    'zh-CN': '通信',
    'zh-Hant': '通訊'
  },
  [ToolTagEnum.enum.finance]: {
    en: 'finance',
    'zh-CN': '金融',
    'zh-Hant': '金融'
  },
  [ToolTagEnum.enum.design]: {
    en: 'design',
    'zh-CN': '设计',
    'zh-Hant': '設計'
  },
  [ToolTagEnum.enum.productivity]: {
    en: 'productivity',
    'zh-CN': '生产力',
    'zh-Hant': '生產力'
  },
  [ToolTagEnum.enum.news]: {
    en: 'news',
    'zh-CN': '新闻',
    'zh-Hant': '新聞'
  },
  [ToolTagEnum.enum.entertainment]: {
    en: 'entertainment',
    'zh-CN': '娱乐',
    'zh-Hant': '娛樂'
  },
  [ToolTagEnum.enum.social]: {
    en: 'social',
    'zh-CN': '社交',
    'zh-Hant': '社群'
  },
  [ToolTagEnum.enum.scientific]: {
    en: 'scientific',
    'zh-CN': '科学',
    'zh-Hant': '科學'
  },
  [ToolTagEnum.enum.other]: {
    en: 'other',
    'zh-CN': '其他',
    'zh-Hant': '其他'
  }
} as const;

export type ToolTagsType = {
  [key in z.infer<typeof ToolTagEnum>]: {
    en: string;
    'zh-CN': string;
    'zh-Hant': string;
  };
};
