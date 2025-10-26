import { defineToolSet } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';

export default defineToolSet({
  name: {
    'zh-CN': '飞书多维表格',
    en: 'Feishu Bitable'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': '提供飞书多维表格的完整操作功能，包括应用管理、数据表管理、记录 CRUD、字段配置查询',
    en: 'Provides comprehensive Feishu Bitable operations including app management, table management, record CRUD, and field configuration'
  },
  toolDescription: `A comprehensive Feishu (Lark) Bitable toolset for managing multidimensional table apps, tables, records, and fields.
Supports complete CRUD operations across all levels: apps, tables, and records.`,
  author: 'FastGPT Team',
  courseUrl: 'https://open.feishu.cn/document/server-docs/docs/bitable-v1/bitable-overview',

  // 使用 appId 和 appSecret 来换取 token
  secretInputConfig: [
    {
      key: 'appId',
      label: '应用 ID (App ID)',
      description: '飞书机器人应用的 App ID， cli_xxx',
      required: true,
      inputType: 'input'
    },
    {
      key: 'appSecret',
      label: '应用密钥 (App Secret)',
      description: '飞书机器人应用的 App Secret',
      required: true,
      inputType: 'secret'
    }
  ]
});
