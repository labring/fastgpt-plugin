import { z } from 'zod';
import { c } from '@/contract/init';
import {
  DatasetSourceInfoSchema,
  DatasetSourceConfigSchema,
  FileItemSchema,
  FileContentResponseSchema
} from './type/source';

// 数据源子路由
export const datasetSourceContract = c.router(
  {
    // 获取所有数据源列表
    list: {
      path: '/list',
      method: 'GET',
      description: 'Get all dataset sources',
      responses: {
        200: z.array(DatasetSourceInfoSchema)
      }
    },

    // 获取数据源配置（含表单字段）
    config: {
      path: '/config',
      method: 'GET',
      description: 'Get dataset source config with form fields',
      query: z.object({
        sourceId: z.string()
      }),
      responses: {
        200: DatasetSourceConfigSchema,
        404: z.object({ error: z.string() })
      }
    },

    // 列出文件/文件夹
    listFiles: {
      path: '/listFiles',
      method: 'POST',
      description: 'List files and folders from dataset source',
      body: z.object({
        sourceId: z.string(),
        config: z.record(z.string(), z.any()),
        parentId: z.string().optional()
      }),
      responses: {
        200: z.array(FileItemSchema),
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() })
      }
    },

    // 获取文件内容
    getContent: {
      path: '/getContent',
      method: 'POST',
      description: 'Get file content from dataset source',
      body: z.object({
        sourceId: z.string(),
        config: z.record(z.string(), z.any()),
        fileId: z.string()
      }),
      responses: {
        200: FileContentResponseSchema,
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() })
      }
    },

    // 获取文件预览链接
    getPreviewUrl: {
      path: '/getPreviewUrl',
      method: 'POST',
      description: 'Get file preview URL from dataset source',
      body: z.object({
        sourceId: z.string(),
        config: z.record(z.string(), z.any()),
        fileId: z.string()
      }),
      responses: {
        200: z.object({ url: z.string() }),
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() })
      }
    },

    // 获取文件详情
    getDetail: {
      path: '/getDetail',
      method: 'POST',
      description: 'Get file detail by ID',
      body: z.object({
        sourceId: z.string(),
        config: z.record(z.string(), z.any()),
        fileId: z.string()
      }),
      responses: {
        200: FileItemSchema,
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() })
      }
    }
  },
  {
    pathPrefix: '/source'
  }
);

// Dataset 主路由
export const datasetContract = c.router(
  {
    source: datasetSourceContract
  },
  {
    pathPrefix: '/dataset'
  }
);
