import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': '企业微信智能表',
    en: 'WeCom Smart Sheet'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN':
      '提供企业微信智能表的完整操作功能，包括文档创建、子表管理、视图管理、字段管理及记录 CRUD 等。',
    en: 'Provides comprehensive WeCom Smart Sheet operations including document creation, sheet management, view management, field management, and record CRUD.'
  },
  toolDescription: `A comprehensive WeCom (Work WeChat) Smart Sheet toolset for managing documents, sheets, views, fields, and records.
Supports complete CRUD operations for efficient data management within WeCom.`,
  author: 'FastGPT Team',
  courseUrl: 'https://developer.work.weixin.qq.com/document/path/96601',

  secretInputConfig: []
});
