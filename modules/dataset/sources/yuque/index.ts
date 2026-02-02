import { z } from 'zod';
import { defineSource, type DatasetSourceCallbacks } from '../../source/registry';
import { yuqueConfig, YuqueConfigSchema, type YuqueConfig } from './config';
import type { FileItem, FileContentResponse } from '../../type/source';

const YUQUE_BASE_URL = process.env.YUQUE_BASE_URL || 'https://www.yuque.com';

function parseConfig(config: Record<string, any>): YuqueConfig {
  return YuqueConfigSchema.parse(config);
}

const YuqueRepoSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  updated_at: z.string(),
  created_at: z.string()
});

const YuqueTocItemSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  title: z.string(),
  type: z.string(), // 'TITLE' | 'DOC' | 'LINK'
  parent_uuid: z.string(),
  child_uuid: z.string(),
  slug: z.string()
});

const YuqueDocSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  body: z.string(),
  body_html: z.string()
});

// 带 Token 的请求
async function yuqueRequest(token: string, path: string): Promise<unknown> {
  const res = await fetch(`${YUQUE_BASE_URL}${path}`, {
    headers: {
      'X-Auth-Token': token,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`语雀请求失败: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json.data;
}

const callbacks: DatasetSourceCallbacks = {
  async listFiles({ config, parentId }): Promise<FileItem[]> {
    const { userId, token, basePath } = parseConfig(config);
    const targetParent = parentId || basePath;

    // 无 parentId：列出所有知识库
    if (!targetParent) {
      const repos: z.infer<typeof YuqueRepoSchema>[] = [];
      let offset = 0;
      const limit = 100;

      while (true) {
        const rawData = await yuqueRequest(
          token,
          `/api/v2/groups/${userId}/repos?offset=${offset}&limit=${limit}`
        );
        const data = z.array(YuqueRepoSchema).parse(rawData);
        if (!data?.length) break;
        repos.push(...data);
        if (data.length < limit) break;
        offset += limit;
      }

      return repos.map((r) => ({
        id: String(r.id),
        rawId: String(r.id),
        name: r.name,
        type: 'folder' as const,
        hasChild: true,
        updateTime: r.updated_at,
        createTime: r.created_at
      }));
    }

    // 纯数字：知识库 ID，列出文档目录
    if (!isNaN(Number(targetParent))) {
      const rawData = await yuqueRequest(token, `/api/v2/repos/${targetParent}/toc`);
      const toc = z.array(YuqueTocItemSchema).parse(rawData);

      return toc
        .filter((item) => !item.parent_uuid && item.type !== 'LINK')
        .map((item) => ({
          id: `${targetParent}-${item.id}-${item.uuid}`,
          rawId: item.uuid,
          name: item.title,
          type: item.type === 'TITLE' ? ('folder' as const) : ('file' as const),
          hasChild: !!item.child_uuid
        }));
    }

    // 复合 ID：repoId-docId-uuid，列出子文档
    const [repoId, , parentUuid] = targetParent.split(/-(.*?)-(.*)/);
    const rawData = await yuqueRequest(token, `/api/v2/repos/${repoId}/toc`);
    const toc = z.array(YuqueTocItemSchema).parse(rawData);

    return toc
      .filter((item) => item.parent_uuid === parentUuid && item.type !== 'LINK')
      .map((item) => ({
        id: `${repoId}-${item.id}-${item.uuid}`,
        rawId: item.uuid,
        name: item.title,
        type: item.type === 'TITLE' ? ('folder' as const) : ('file' as const),
        hasChild: !!item.child_uuid
      }));
  },

  async getFileContent({ config, fileId }): Promise<FileContentResponse> {
    const { token } = parseConfig(config);

    // fileId 格式: repoId-docId-uuid
    const [repoId, docId] = fileId.split(/-(.*?)-(.*)/);
    if (!repoId || !docId) {
      throw new Error(`Invalid fileId format: ${fileId}`);
    }

    const rawData = await yuqueRequest(token, `/api/v2/repos/${repoId}/docs/${docId}`);
    const doc = YuqueDocSchema.parse(rawData);

    return {
      title: doc.title,
      rawText: doc.body
    };
  },

  async getFilePreviewUrl({ config, fileId }): Promise<string> {
    const { userId, token } = parseConfig(config);

    // fileId 格式: repoId-docId-uuid
    const [repoId, docId] = fileId.split(/-(.*?)-(.*)/);
    if (!repoId || !docId) {
      throw new Error(`Invalid fileId format: ${fileId}`);
    }

    const [rawRepoData, rawDocData] = await Promise.all([
      yuqueRequest(token, `/api/v2/repos/${repoId}`),
      yuqueRequest(token, `/api/v2/repos/${repoId}/docs/${docId}`)
    ]);

    const repo = YuqueRepoSchema.parse(rawRepoData);
    const doc = YuqueDocSchema.parse(rawDocData);

    return `${YUQUE_BASE_URL}/${userId}/${repo.slug}/${doc.slug}`;
  },

  async getFileDetail({ config, fileId }): Promise<FileItem> {
    const { token } = parseConfig(config);

    // 纯数字：知识库 ID
    if (!isNaN(Number(fileId))) {
      const rawData = await yuqueRequest(token, `/api/v2/repos/${fileId}`);
      const repo = YuqueRepoSchema.parse(rawData);
      return {
        id: String(repo.id),
        rawId: String(repo.id),
        name: repo.name,
        type: 'folder',
        hasChild: true,
        updateTime: repo.updated_at,
        createTime: repo.created_at
      };
    }

    // 复合 ID：repoId-docId-uuid
    const [repoId, docId, uuid] = fileId.split(/-(.*?)-(.*)/);
    const rawData = await yuqueRequest(token, `/api/v2/repos/${repoId}/toc`);
    const toc = z.array(YuqueTocItemSchema).parse(rawData);
    const item = toc.find((t) => t.uuid === uuid || String(t.id) === docId);

    if (!item) {
      throw new Error(`File not found: ${fileId}`);
    }

    // 构造 parentId：找到父节点，用其 id 和 uuid
    let parentId: string | null = null;
    if (item.parent_uuid) {
      const parentItem = toc.find((t) => t.uuid === item.parent_uuid);
      parentId = parentItem ? `${repoId}-${parentItem.id}-${parentItem.uuid}` : String(repoId);
    } else {
      // 无父节点，父级是知识库
      parentId = String(repoId);
    }

    return {
      id: `${repoId}-${item.id}-${item.uuid}`,
      rawId: item.uuid,
      parentId,
      name: item.title,
      type: item.type === 'TITLE' ? 'folder' : 'file',
      hasChild: !!item.child_uuid
    };
  }
};

export default defineSource(yuqueConfig, callbacks);
