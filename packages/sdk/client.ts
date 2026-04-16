import type { I18nStringStrictType } from '@fastgpt-plugin/helpers/common/schemas/i18n';
import type {
  DatasetSourceConfig,
  DatasetSourceInfo,
  FileContentResponse,
  FileItem} from '@fastgpt-plugin/helpers/datasets/schemas';
import type { AiproxyMapProviderType } from '@fastgpt-plugin/helpers/models/constants';
import type { ListModelsType } from '@fastgpt-plugin/helpers/models/schemas';
import type {
  ToolDetailResponseType,
  ToolListItemType,
  ToolTagListType
} from '@fastgpt-plugin/helpers/tools/schemas/api';
import type { TemplateListType } from '@fastgpt-plugin/helpers/workflows/schemas';

interface Result<T> {
  code: number;
  msg: string;
  data?: T | null;
}

export class FastGPTPluginClient {
  private baseUrl: string;
  private token: string;

  constructor({ baseUrl, token }: { baseUrl: string; token: string }) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers);
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    if (options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || response.statusText || 'Request failed');
    }

    const result = (await response.json()) as Result<T>;
    if (result.code !== 0) {
      throw new Error(result.msg || 'Request failed');
    }

    return result.data as T;
  }

  // Models
  async listModels() {
    return this.request<ListModelsType>('/api/models');
  }

  async getModelProviders() {
    return this.request<{
      modelProviders: { provider: string; value: I18nStringStrictType; avatar: string }[];
      aiproxyIdMap: AiproxyMapProviderType;
    }>('/api/models/get-providers');
  }

  // Tools
  async listTools() {
    return this.request<ToolListItemType[]>('/api/tools');
  }

  async getToolTags() {
    return this.request<ToolTagListType>('/api/tools/tags');
  }

  async getTool(toolId: string) {
    return this.request<ToolDetailResponseType>(`/api/tools/${toolId}`);
  }

  async confirmToolUpload(toolIds: string[]) {
    return this.request<{ message: string }>('/api/tools/upload/confirm', {
      method: 'POST',
      body: JSON.stringify({ toolIds })
    });
  }

  async deleteTool(toolId: string, version?: string) {
    const query = version
      ? `?toolId=${encodeURIComponent(toolId)}&version=${encodeURIComponent(version)}`
      : `?toolId=${encodeURIComponent(toolId)}`;
    return this.request<{ message: string }>(`/api/tools/upload/delete${query}`, {
      method: 'DELETE'
    });
  }

  async installTools(urls: string[]) {
    return this.request<{ message: string }>('/api/tools/upload/install', {
      method: 'POST',
      body: JSON.stringify({ urls })
    });
  }

  async uploadAndParseTool(file: File | Blob, filename?: string) {
    const formData = new FormData();
    formData.append('file', file, filename ?? (file instanceof File ? file.name : 'plugin.pkg'));
    return this.request<ToolDetailType[]>('/api/tools/upload/parse-tool', {
      method: 'POST',
      body: formData
    });
  }

  // Workflow
  async listWorkflows() {
    return this.request<TemplateListType>('/api/list');
  }

  // Dataset
  get dataset() {
    return {
      listSources: () => this.request<DatasetSourceInfo[]>('/api/dataset/source/list'),

      getSourceConfig: (sourceId: string) =>
        this.request<DatasetSourceConfig>(`/api/dataset/source/config?sourceId=${sourceId}`),

      listFiles: (params: { sourceId: string; config: Record<string, any>; parentId?: string }) =>
        this.request<FileItem[]>('/api/dataset/source/listFiles', {
          method: 'POST',
          body: JSON.stringify(params)
        }),

      getContent: (params: { sourceId: string; config: Record<string, any>; fileId: string }) =>
        this.request<FileContentResponse>('/api/dataset/source/getContent', {
          method: 'POST',
          body: JSON.stringify(params)
        }),

      getPreviewUrl: (params: { sourceId: string; config: Record<string, any>; fileId: string }) =>
        this.request<{ url: string }>('/api/dataset/source/getPreviewUrl', {
          method: 'POST',
          body: JSON.stringify(params)
        }),

      getDetail: (params: { sourceId: string; config: Record<string, any>; fileId: string }) =>
        this.request<FileItem>('/api/dataset/source/getDetail', {
          method: 'POST',
          body: JSON.stringify(params)
        })
    };
  }
}

export { RunToolWithStream } from './stream';
export {
  I18nStringSchema,
  I18nStringStrictSchema,
  type I18nStringStrictType,
  type I18nStringType
} from '@fastgpt-plugin/helpers/common/schemas/i18n';
export {
  StreamDataAnswerTypeEnum,
  type StreamMessageType,
  type SystemVarType} from '@fastgpt-plugin/helpers/tools/schemas/req';

// Tool S3 path constants
export { PluginBaseS3Prefix,UploadToolsS3Path } from '@fastgpt-plugin/helpers/tools/constants';
export { ToolTagsNameMap } from '@fastgpt-plugin/helpers/tools/constants';
export {
  ToolDetailResponseSchema,
  type ToolDetailResponseType,
  ToolListItemSchema,
  type ToolListItemType,
  ToolTagListSchema,
  type ToolTagListType
} from '@fastgpt-plugin/helpers/tools/schemas/api';
export { ToolTagEnum } from '@fastgpt-plugin/helpers/tools/schemas/tool';

// Model related exports
export {
  type AiproxyMapProviderType,
  ModelProviders} from '@fastgpt-plugin/helpers/models/constants';

// Dataset Source Types and Constants
export type {
  DatasetSourceConfig,
  DatasetSourceId,
  DatasetSourceInfo,
  FileContentResponse,
  FileItem,
  FormFieldConfig,
  FormFieldType,
  PluginDatasetSourceId} from '@fastgpt-plugin/helpers/datasets/schemas';
export { PluginDatasetSourceIds } from '@fastgpt-plugin/helpers/datasets/schemas';
export {
  ToolPermissionEnum,
  ToolPermissionEnumSchema,
  type ToolPermissionEnumType
} from '@fastgpt-plugin/helpers/tools/schemas/permission';
