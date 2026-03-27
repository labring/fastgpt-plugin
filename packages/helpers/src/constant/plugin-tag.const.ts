import { PluginTagEnum } from '@fastgpt-plugin/domain/entities/plugin.entity';

export const PluginTagsNameMap = {
  [PluginTagEnum.tools]: {
    en: 'tools',
    'zh-CN': '工具',
    'zh-Hant': '工具'
  },
  [PluginTagEnum.search]: {
    en: 'search',
    'zh-CN': '搜索',
    'zh-Hant': '搜尋'
  },
  [PluginTagEnum.multimodal]: {
    en: 'multimodal',
    'zh-CN': '多模态',
    'zh-Hant': '多模態'
  },
  [PluginTagEnum.communication]: {
    en: 'communication',
    'zh-CN': '通信',
    'zh-Hant': '通訊'
  },
  [PluginTagEnum.finance]: {
    en: 'finance',
    'zh-CN': '金融',
    'zh-Hant': '金融'
  },
  [PluginTagEnum.design]: {
    en: 'design',
    'zh-CN': '设计',
    'zh-Hant': '設計'
  },
  [PluginTagEnum.productivity]: {
    en: 'productivity',
    'zh-CN': '生产力',
    'zh-Hant': '生產力'
  },
  [PluginTagEnum.news]: {
    en: 'news',
    'zh-CN': '新闻',
    'zh-Hant': '新聞'
  },
  [PluginTagEnum.entertainment]: {
    en: 'entertainment',
    'zh-CN': '娱乐',
    'zh-Hant': '娛樂'
  },
  [PluginTagEnum.social]: {
    en: 'social',
    'zh-CN': '社交',
    'zh-Hant': '社群'
  },
  [PluginTagEnum.scientific]: {
    en: 'scientific',
    'zh-CN': '科学',
    'zh-Hant': '科學'
  },
  [PluginTagEnum.other]: {
    en: 'other',
    'zh-CN': '其他',
    'zh-Hant': '其他'
  }
} as const;

// // ==================== S3 Path Constants ====================

// /**
//  * S3 路径：上传的工具存储路径
//  */
// export const UploadToolsS3Path = 'system/plugin/tools';

// /**
//  * S3 路径：插件文件的基础前缀
//  */
// export const PluginBaseS3Prefix = 'system/plugin/files';
