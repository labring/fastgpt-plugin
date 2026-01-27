import { z } from 'zod';
import { DatasetSourceIdEnum, type DatasetSourceConfig } from '../../type/source';
import { getDatasetSourceAvatarUrl, getDatasetSourceOutlineAvatarUrl } from '../../avatars';

const SOURCE_ID = DatasetSourceIdEnum.enum.yuque;

// Config Schema
export const YuqueConfigSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  token: z.string().min(1, 'token is required'),
  basePath: z.string().optional()
});

export type YuqueConfig = z.infer<typeof YuqueConfigSchema>;

export const yuqueConfig: DatasetSourceConfig = {
  sourceId: SOURCE_ID,
  name: {
    en: 'Yuque',
    'zh-CN': '语雀知识库'
  },
  icon: getDatasetSourceAvatarUrl(SOURCE_ID),
  iconOutline: getDatasetSourceOutlineAvatarUrl(SOURCE_ID),
  description: {
    en: 'Build knowledge base using Yuque documents by configuring document permissions, documents will not be stored twice',
    'zh-CN': '可通过配置语雀文档权限，使用语雀文档构建知识库，文档不会进行二次存储',
    'zh-Hant': '可透過設定語雀文件權限，使用語雀文件建構知識庫，文件不會進行二次儲存'
  },
  courseUrl: '/docs/introduction/guide/knowledge_base/yuque_dataset/',

  formFields: [
    {
      key: 'userId',
      label: { en: 'User ID', 'zh-CN': 'User ID' },
      type: 'input',
      required: true,
      placeholder: { en: 'Enter User ID', 'zh-CN': '请输入 User ID' }
    },
    {
      key: 'token',
      label: { en: 'Token', 'zh-CN': 'Token' },
      type: 'password',
      required: true,
      placeholder: { en: 'Enter Token', 'zh-CN': '请输入 Token' }
    },
    {
      key: 'basePath',
      label: { en: 'Base Path', 'zh-CN': '起始目录' },
      type: 'tree-select',
      required: false,
      description: {
        en: 'Optional: Select specific knowledge base',
        'zh-CN': '可选：选择特定知识库'
      }
    }
  ]
};
