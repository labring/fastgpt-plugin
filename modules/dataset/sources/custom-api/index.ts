import { defineSource, type DatasetSourceCallbacks } from '../../source/registry';
import { customApiConfig, CustomApiConfigSchema, type CustomApiConfig } from './config';
import type { FileItem, FileContentResponse } from '../../type/source';

type ResponseDataType = {
  success: boolean;
  message: string;
  data: any;
};

type APIFileListResponse = {
  id: string;
  parentId: string | null;
  name: string;
  type: 'file' | 'folder';
  updateTime: string;
  createTime: string;
  hasChild?: boolean;
};

type APIFileContentResponse = {
  title?: string;
  content?: string;
  previewUrl?: string;
};

type APIFileReadResponse = {
  url: string;
};

type APIFileDetailResponse = {
  id: string;
  name: string;
  parentId: string | null;
  type: 'file' | 'folder';
  updateTime: string;
  createTime: string;
};

function parseConfig(config: Record<string, any>): CustomApiConfig {
  return CustomApiConfigSchema.parse(config);
}

/**
 * 响应数据检查
 */
function checkResponse(data: ResponseDataType): any {
  if (data === undefined) {
    throw new Error('服务器异常：响应为空');
  }
  if (!data.success) {
    throw new Error(data.message || '请求失败');
  }
  return data.data;
}

/**
 * 发送请求到用户的自定义 API
 */
async function apiRequest<T>(
  baseUrl: string,
  authorization: string | undefined,
  path: string,
  method: 'GET' | 'POST',
  data?: Record<string, any>
): Promise<T> {
  // 清理 undefined 值
  if (data) {
    for (const key in data) {
      if (data[key] === undefined) {
        delete data[key];
      }
    }
  }

  const url = new URL(path, baseUrl);
  const isGetMethod = method === 'GET';

  // GET 请求将参数添加到 URL
  if (isGetMethod && data) {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (authorization) {
    headers['Authorization'] = `Bearer ${authorization}`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: isGetMethod ? undefined : JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status} ${response.statusText}`);
  }

  const jsonData = await response.json();
  return checkResponse(jsonData);
}

const callbacks: DatasetSourceCallbacks = {
  async listFiles({ config, parentId }): Promise<FileItem[]> {
    const { baseUrl, authorization, basePath } = parseConfig(config);

    const files = await apiRequest<APIFileListResponse[]>(
      baseUrl,
      authorization,
      '/v1/file/list',
      'POST',
      {
        parentId: parentId || basePath
      }
    );

    if (!Array.isArray(files)) {
      throw new Error('Invalid file list format');
    }

    return files.map((file) => ({
      id: file.id,
      rawId: file.id,
      parentId: file.parentId,
      name: file.name,
      type: file.type,
      hasChild: file.hasChild ?? file.type === 'folder',
      updateTime: file.updateTime,
      createTime: file.createTime
    }));
  },

  async getFileContent({ config, fileId }): Promise<FileContentResponse> {
    const { baseUrl, authorization } = parseConfig(config);

    const data = await apiRequest<APIFileContentResponse>(
      baseUrl,
      authorization,
      '/v1/file/content',
      'GET',
      { id: fileId }
    );

    const { title, content, previewUrl } = data;

    // 如果有直接内容，返回
    if (content) {
      return {
        title,
        rawText: content
      };
    }

    // 如果有预览 URL，返回给 FastGPT 去解析
    if (previewUrl) {
      return {
        title,
        previewUrl
      };
    }

    throw new Error('Invalid content type: content or previewUrl is required');
  },

  async getFilePreviewUrl({ config, fileId }): Promise<string> {
    const { baseUrl, authorization } = parseConfig(config);

    const data = await apiRequest<APIFileReadResponse>(
      baseUrl,
      authorization,
      '/v1/file/read',
      'GET',
      { id: fileId }
    );

    if (!data.url || typeof data.url !== 'string') {
      throw new Error('Invalid response url');
    }

    return data.url;
  },

  async getFileDetail({ config, fileId }): Promise<FileItem> {
    const { baseUrl, authorization } = parseConfig(config);

    const data = await apiRequest<APIFileDetailResponse>(
      baseUrl,
      authorization,
      '/v1/file/detail',
      'GET',
      { id: fileId }
    );

    if (!data) {
      throw new Error('File not found');
    }

    return {
      id: data.id,
      rawId: fileId,
      parentId: data.parentId,
      name: data.name,
      type: data.type,
      hasChild: data.type === 'folder',
      updateTime: data.updateTime,
      createTime: data.createTime
    };
  }
};

export default defineSource(customApiConfig, callbacks);
