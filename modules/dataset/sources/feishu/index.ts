import { z } from 'zod';
import { defineSource, type DatasetSourceCallbacks } from '../../source/registry';
import { feishuConfig, FeishuConfigSchema, type FeishuConfig } from './config';
import type { FileItem, FileContentResponse } from '../../type/source';

const FEISHU_BASE_URL = process.env.FEISHU_BASE_URL || 'https://open.feishu.cn';

function parseConfig(config: Record<string, any>): FeishuConfig {
  return FeishuConfigSchema.parse(config);
}

// API 响应 Schema
const FeishuTokenResponseSchema = z.object({
  code: z.number(),
  msg: z.string().optional(),
  tenant_access_token: z.string().optional(),
  expire: z.number().optional()
});

const FeishuFileItemSchema = z.object({
  token: z.string(),
  parent_token: z.string(),
  name: z.string(),
  type: z.string(),
  modified_time: z.string(),
  created_time: z.string()
});

const FeishuFileListResponseSchema = z.object({
  files: z.array(FeishuFileItemSchema).optional(),
  has_more: z.boolean(),
  next_page_token: z.string().optional()
});

const FeishuDocContentResponseSchema = z.object({
  content: z.string()
});

const FeishuDocMetaResponseSchema = z.object({
  document: z.object({
    title: z.string(),
    document_id: z.string().optional()
  })
});

const FeishuBatchMetaResponseSchema = z.object({
  metas: z.array(
    z.object({
      url: z.string().optional()
    })
  )
});

// Token 缓存（基于 appId:appSecret 作为 key）
const tokenCache = new Map<string, { token: string; expireAt: number }>();

// 获取 Access Token（带缓存）
async function getAccessToken(appId: string, appSecret: string): Promise<string> {
  const cacheKey = `${appId}:${appSecret}`;
  const cached = tokenCache.get(cacheKey);

  // 检查缓存是否有效（预留 5 分钟余量）
  if (cached && cached.expireAt > Date.now() + 5 * 60 * 1000) {
    return cached.token;
  }

  const res = await fetch(`${FEISHU_BASE_URL}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret })
  });

  const rawData = await res.json();
  const data = FeishuTokenResponseSchema.parse(rawData);

  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`获取飞书 Token 失败: ${data.msg}`);
  }

  // 缓存 token，expire 单位是秒
  tokenCache.set(cacheKey, {
    token: data.tenant_access_token,
    expireAt: Date.now() + (data.expire || 7200) * 1000
  });

  return data.tenant_access_token;
}

// 带 Token 的请求
async function feishuRequest(token: string, path: string, options?: RequestInit): Promise<unknown> {
  const res = await fetch(`${FEISHU_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(data.msg || '飞书请求失败');
  }

  return data.data;
}

const callbacks: DatasetSourceCallbacks = {
  async listFiles({ config, parentId }): Promise<FileItem[]> {
    const { appId, appSecret, folderToken } = parseConfig(config);
    const token = await getAccessToken(appId, appSecret);

    const targetFolder = parentId || folderToken;
    const allFiles: z.infer<typeof FeishuFileItemSchema>[] = [];
    let pageToken = '';

    do {
      const params = new URLSearchParams({
        folder_token: targetFolder,
        page_size: '200',
        ...(pageToken && { page_token: pageToken })
      });

      const rawData = await feishuRequest(token, `/open-apis/drive/v1/files?${params}`);
      const data = FeishuFileListResponseSchema.parse(rawData);

      allFiles.push(...(data.files || []));
      pageToken = data.next_page_token || '';
    } while (pageToken);

    // 只支持 folder 和 docx 类型
    return allFiles
      .filter((f) => ['folder', 'docx'].includes(f.type))
      .map((f) => ({
        id: f.token,
        rawId: f.token,
        parentId: f.parent_token,
        name: f.name,
        type: f.type === 'folder' ? ('folder' as const) : ('file' as const),
        hasChild: f.type === 'folder',
        updateTime: new Date(Number(f.modified_time) * 1000).toISOString(),
        createTime: new Date(Number(f.created_time) * 1000).toISOString()
      }));
  },

  async getFileContent({ config, fileId }): Promise<FileContentResponse> {
    const { appId, appSecret } = parseConfig(config);
    const token = await getAccessToken(appId, appSecret);

    const [rawContentData, rawMetaData] = await Promise.all([
      feishuRequest(token, `/open-apis/docx/v1/documents/${fileId}/raw_content`),
      feishuRequest(token, `/open-apis/docx/v1/documents/${fileId}`)
    ]);

    const contentData = FeishuDocContentResponseSchema.parse(rawContentData);
    const metaData = FeishuDocMetaResponseSchema.parse(rawMetaData);

    return {
      title: metaData.document.title,
      rawText: contentData.content
    };
  },

  async getFilePreviewUrl({ config, fileId }): Promise<string> {
    const { appId, appSecret } = parseConfig(config);
    const token = await getAccessToken(appId, appSecret);

    const rawData = await feishuRequest(token, `/open-apis/drive/v1/metas/batch_query`, {
      method: 'POST',
      body: JSON.stringify({
        request_docs: [{ doc_token: fileId, doc_type: 'docx' }],
        with_url: true
      })
    });

    const data = FeishuBatchMetaResponseSchema.parse(rawData);

    return data.metas[0]?.url || '';
  },

  async getFileDetail({ config, fileId }): Promise<FileItem> {
    const { appId, appSecret } = parseConfig(config);
    const token = await getAccessToken(appId, appSecret);

    const rawData = await feishuRequest(token, `/open-apis/docx/v1/documents/${fileId}`);
    const data = FeishuDocMetaResponseSchema.parse(rawData);

    return {
      id: fileId,
      rawId: fileId,
      parentId: null,
      name: data.document.title,
      type: 'file',
      hasChild: false
    };
  }
};

export default defineSource(feishuConfig, callbacks);
