import { z } from 'zod';
import type { DatasetSourceConfig } from '../../type/source';
import { getDatasetSourceAvatarUrl, getDatasetSourceOutlineAvatarUrl } from '../../avatars';

const SOURCE_ID = 'feishu';

// Config Schema
export const FeishuConfigSchema = z.object({
  appId: z.string().min(1, 'appId is required'),
  appSecret: z.string().min(1, 'appSecret is required'),
  folderToken: z.string().min(1, 'folderToken is required')
});

export type FeishuConfig = z.infer<typeof FeishuConfigSchema>;

export const feishuConfig: DatasetSourceConfig = {
  sourceId: SOURCE_ID,
  name: {
    en: 'Feishu',
    'zh-CN': '飞书知识库'
  },
  description: {
    en: 'Can build a dataset using Feishu documents by configuring permissions, without secondary storage',
    'zh-CN': '可通过配置飞书文档权限，使用飞书文档构建知识库，文档不会进行二次存储',
    'zh-Hant': '可透過設定飛書文件權限，使用飛書文件建構知識庫，文件不會進行二次儲存'
  },
  icon: getDatasetSourceAvatarUrl(SOURCE_ID),
  iconOutline: getDatasetSourceOutlineAvatarUrl(SOURCE_ID),
  version: '1.0.0',
  courseUrl: '/docs/introduction/guide/knowledge_base/lark_dataset/',

  formFields: [
    {
      key: 'appId',
      label: { en: 'App ID', 'zh-CN': 'App ID' },
      type: 'input',
      required: true,
      placeholder: { en: 'Enter App ID', 'zh-CN': '请输入 App ID' }
    },
    {
      key: 'appSecret',
      label: { en: 'App Secret', 'zh-CN': 'App Secret' },
      type: 'password',
      required: true,
      placeholder: { en: 'Enter App Secret', 'zh-CN': '请输入 App Secret' }
    },
    {
      key: 'folderToken',
      label: { en: 'Folder Token', 'zh-CN': 'Folder Token' },
      type: 'input',
      required: true,
      placeholder: { en: 'Enter Folder Token', 'zh-CN': '请输入 Folder Token' }
    }
  ]
};
