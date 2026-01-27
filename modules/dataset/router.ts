import { s } from '@/router/init';
import { contract } from '@/contract';
import { sourceRegistry } from './source/registry';
import { getDatasetSourceAvatarUrl, getDatasetSourceOutlineAvatarUrl } from './avatars';

// 注册数据源
import customApiSource from './sources/custom-api';
import feishuSource from './sources/feishu';
import yuqueSource from './sources/yuque';

sourceRegistry.register(customApiSource);
sourceRegistry.register(feishuSource);
sourceRegistry.register(yuqueSource);

// 数据源子路由
const datasetSourceRouter = s.router(contract.dataset.source, {
  // 获取所有数据源列表
  list: async () => {
    const sources = sourceRegistry.list();
    const sourcesWithIcons = sources.map(({ formFields, ...info }) => ({
      ...info,
      icon: getDatasetSourceAvatarUrl(info.sourceId),
      iconOutline: getDatasetSourceOutlineAvatarUrl(info.sourceId)
    }));
    return {
      status: 200 as const,
      body: sourcesWithIcons
    };
  },

  // 获取数据源配置
  config: async ({ query }) => {
    const config = sourceRegistry.list().find((s) => s.sourceId === query.sourceId);
    if (!config) {
      return {
        status: 404 as const,
        body: { error: `Source not found: ${query.sourceId}` }
      };
    }
    return {
      status: 200 as const,
      body: config
    };
  },

  // 列出文件
  listFiles: async ({ body }) => {
    const callbacks = sourceRegistry.getCallbacks(body.sourceId);
    if (!callbacks) {
      return {
        status: 404 as const,
        body: { error: `Source not found: ${body.sourceId}` }
      };
    }

    try {
      const files = await callbacks.listFiles({
        config: body.config,
        parentId: body.parentId
      });
      return {
        status: 200 as const,
        body: files
      };
    } catch (error) {
      return {
        status: 400 as const,
        body: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  },

  // 获取文件内容
  getContent: async ({ body }) => {
    const callbacks = sourceRegistry.getCallbacks(body.sourceId);
    if (!callbacks) {
      return {
        status: 404 as const,
        body: { error: `Source not found: ${body.sourceId}` }
      };
    }

    try {
      const content = await callbacks.getFileContent({
        config: body.config,
        fileId: body.fileId
      });
      return {
        status: 200 as const,
        body: content
      };
    } catch (error) {
      return {
        status: 400 as const,
        body: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  },

  // 获取预览链接
  getPreviewUrl: async ({ body }) => {
    const callbacks = sourceRegistry.getCallbacks(body.sourceId);
    if (!callbacks) {
      return {
        status: 404 as const,
        body: { error: `Source not found: ${body.sourceId}` }
      };
    }

    try {
      const url = await callbacks.getFilePreviewUrl({
        config: body.config,
        fileId: body.fileId
      });
      return {
        status: 200 as const,
        body: { url }
      };
    } catch (error) {
      return {
        status: 400 as const,
        body: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  },

  // 获取文件详情
  getDetail: async ({ body }) => {
    const callbacks = sourceRegistry.getCallbacks(body.sourceId);
    if (!callbacks) {
      return {
        status: 404 as const,
        body: { error: `Source not found: ${body.sourceId}` }
      };
    }

    try {
      const detail = await callbacks.getFileDetail({
        config: body.config,
        fileId: body.fileId
      });
      return {
        status: 200 as const,
        body: detail
      };
    } catch (error) {
      return {
        status: 400 as const,
        body: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
});

// Dataset 主路由
export const datasetRouter = s.router(contract.dataset, {
  source: datasetSourceRouter
});
