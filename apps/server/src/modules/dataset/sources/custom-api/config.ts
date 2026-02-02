import { z } from 'zod';
import { DatasetSourceIdEnum, type DatasetSourceConfig } from '../../type/source';
import { getDatasetSourceAvatarUrl, getDatasetSourceOutlineAvatarUrl } from '../../avatars';

const SOURCE_ID = DatasetSourceIdEnum.enum['custom-api'];

// Config Schema
export const CustomApiConfigSchema = z.object({
  baseUrl: z.string().min(1, 'baseUrl is required'),
  authorization: z.string().optional(),
  basePath: z.string().optional()
});

export type CustomApiConfig = z.infer<typeof CustomApiConfigSchema>;

export const customApiConfig: DatasetSourceConfig = {
  sourceId: SOURCE_ID,
  name: {
    en: 'Custom API',
    'zh-CN': 'API 文件库',
    'zh-Hant': 'API 檔案庫'
  },
  description: {
    en: 'Build knowledge base using external file library through custom API',
    'zh-CN': '可以通过 API，使用外部文件库构建知识库',
    'zh-Hant': '可以透過 API，使用外部檔案庫建構知識庫'
  },
  icon: getDatasetSourceAvatarUrl(SOURCE_ID),
  iconOutline: getDatasetSourceOutlineAvatarUrl(SOURCE_ID),
  courseUrl: '/docs/introduction/guide/knowledge_base/api_dataset/',

  formFields: [
    {
      key: 'baseUrl',
      label: {
        en: 'API URL',
        'zh-CN': '接口地址',
        'zh-Hant': '介面地址'
      },
      type: 'input',
      required: true,
      placeholder: {
        en: 'Enter API base URL',
        'zh-CN': '请输入接口地址',
        'zh-Hant': '請輸入介面地址'
      }
    },
    {
      key: 'authorization',
      label: {
        en: 'Authorization',
        'zh-CN': '鉴权参数',
        'zh-Hant': '鑑權參數'
      },
      type: 'password',
      required: false,
      placeholder: {
        en: 'Request headers, will automatically append Bearer',
        'zh-CN': '请求头参数，会自动补充 Bearer',
        'zh-Hant': '請求頭參數，會自動補充 Bearer'
      }
    },
    {
      key: 'basePath',
      label: {
        en: 'Base Path',
        'zh-CN': '起始目录',
        'zh-Hant': '起始目錄'
      },
      type: 'tree-select',
      required: false,
      description: {
        en: 'Optional: Select specific folder as starting point',
        'zh-CN': '可选：选择特定文件夹作为起始目录',
        'zh-Hant': '可選：選擇特定資料夾作為起始目錄'
      }
    }
  ]
};
