import type { ToolDetailType } from '@tool/type/api';
import type { Result } from '@/utils/http';
import type { ListModelsType } from '@model/api/type';
import type { TemplateListType } from '@workflow/type';
import type { AiproxyMapProviderType } from '@model/constants/shared';
import type { I18nStringStrictType } from '@/validates/i18n';

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
    return this.request<ToolDetailType[]>('/api/tools');
  }

  async getToolTags() {
    return this.request<{ id: string; name: I18nStringStrictType }[]>('/api/tools/tags');
  }

  async getTool(toolId: string) {
    return this.request<ToolDetailType>(`/api/tools/${toolId}`);
  }

  async getToolUploadUrl(filename: string) {
    return this.request<{
      postURL: string;
      formData: Record<string, any>;
      objectName: string;
    }>(`/api/tools/upload/presign-tool-put-url?filename=${filename}`);
  }

  async confirmToolUpload(toolIds: string[]) {
    return this.request<{ message: string }>('/api/tools/upload/confirm', {
      method: 'POST',
      body: JSON.stringify({ toolIds })
    });
  }

  async deleteTool(toolId: string) {
    return this.request<{ message: string }>(`/api/tools/upload/delete?toolId=${toolId}`, {
      method: 'DELETE'
    });
  }

  async installTools(urls: string[]) {
    return this.request<{ message: string }>('/api/tools/upload/install', {
      method: 'POST',
      body: JSON.stringify({ urls })
    });
  }

  async parseUploadedTool(objectName: string) {
    return this.request<ToolDetailType[]>(
      `/api/tools/upload/parse-uploaded-tool?objectName=${objectName}`
    );
  }

  // Workflow
  async listWorkflows() {
    return this.request<TemplateListType>('/api/list');
  }
}

export {
  I18nStringSchema,
  I18nStringStrictSchema,
  type I18nStringStrictType,
  type I18nStringType
} from '@/validates/i18n';
export type { SystemVarType, StreamMessageType } from '@tool/type/req';
export { RunToolWithStream } from './stream';
export { StreamDataAnswerTypeEnum } from '@tool/type/req';
export { UploadToolsS3Path } from '@tool/constants/shared';
export { ToolTagEnum, ToolTagsNameMap } from '@tool/type/tags';
export { ModelProviders } from '@model/constants/shared';
export type { ToolType, ToolSetType } from '@tool/type';
export { ToolDetailSchema } from '@tool/type/api';
export { ToolSimpleSchema } from '@tool/type/api';
export type { ToolDetailType, ToolSimpleType } from '@tool/type/api';
export type { AiproxyMapProviderType };
// Dataset Source Types
export type {
  FormFieldType,
  FormFieldConfig,
  DatasetSourceInfo,
  DatasetSourceConfig,
  FileItem,
  FileContentResponse
} from '@dataset/type/source';
