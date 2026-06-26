import { createHash } from 'node:crypto';

import { type PluginType, PluginTypeEnum } from '@domain/entities/plugin.entity';
import { ToolSchema } from '@domain/entities/tool.entity';
import type {
  PluginListInputType,
  PluginListOutputType,
  PluginRepoPort,
  PluginVersionListInputType,
  PluginVersionListOutputType
} from '@domain/ports/plugin/plugin-repo.port';
import {
  PluginListItemSchema,
  PluginVersionItemSchema
} from '@domain/ports/plugin/plugin-repo.port';
import type {
  ToolListInputType,
  ToolListOutputType
} from '@domain/ports/plugin/tool.port';
import { ToolListItemSchema } from '@domain/ports/plugin/tool.port';
import { createError } from '@domain/value-objects/error.vo';
import type { FileObject } from '@domain/value-objects/file/file-object.vo';
import type { PkgContentFileObjects } from '@domain/value-objects/file/pkg-file.vo';
import type {
  PluginSourceType,
  PluginUniqueIdType,
  UserPluginIdType
} from '@domain/value-objects/plugin.vo';
import { isPluginDebugSource } from '@domain/value-objects/plugin-debug-session.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { ErrorCode } from '@infrastructure/errors/error.registry';

type GatewayStatusResponse = {
  data: {
    session: {
      id: string;
      status?: string;
      sessionScope: {
        source?: string;
      };
      metadata?: {
        pluginDebug?: DebugPluginMetadata | DebugPluginMetadataBundle;
      };
    } | null;
    ownerAlive?: boolean;
  };
};

type DebugPluginMetadata = DebugPluginMetadataPayload & {
  source?: string;
};

type DebugPluginMetadataPayload = {
  pluginId: string;
  version: string;
  name: string;
  description: string;
  toolDescription: string;
  author?: string;
  tags?: string[];
  permissions?: string[];
  secretSchema?: Record<string, unknown>;
  isToolSet: boolean;
  tools: Array<{
    id: string;
    name: string;
    description: string;
    toolDescription: string;
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown>;
  }>;
};

type DebugPluginMetadataBundle = {
  targets: DebugPluginMetadata[];
};

export class DebugPluginRepoOverlay implements PluginRepoPort {
  constructor(
    private readonly deps: {
      fallback: PluginRepoPort;
      gatewayBaseUrl: string;
      authToken: string;
    }
  ) {}

  getPendingPluginIds(): ReturnType<PluginRepoPort['getPendingPluginIds']> {
    return this.deps.fallback.getPendingPluginIds();
  }

  createPlugin(arg: { plugin: PluginType; pending?: boolean; files: PkgContentFileObjects }): Promise<Result> {
    return this.deps.fallback.createPlugin(arg);
  }

  confirmPlugin(uniqueId: PluginUniqueIdType): Promise<Result<PluginType>> {
    return this.deps.fallback.confirmPlugin(uniqueId);
  }

  deletePendingPlugin(uniqueId: PluginUniqueIdType): Promise<Result> {
    return this.deps.fallback.deletePendingPlugin(uniqueId);
  }

  getPluginById(
    uniqueId: PluginUniqueIdType
  ): Promise<Result<{ info: PluginType; indexFile: FileObject; entryFilePath: string }>> {
    return this.deps.fallback.getPluginById(uniqueId);
  }

  getPluginsByPluginId(pluginId: string): Promise<Result<PluginType[]>> {
    return this.deps.fallback.getPluginsByPluginId(pluginId);
  }

  async getPluginByUserPluginId(userPluginId: UserPluginIdType): Promise<Result<PluginType>> {
    if (!isPluginDebugSource(userPluginId.source)) {
      return this.deps.fallback.getPluginByUserPluginId(userPluginId);
    }

    const [metadata, err] = await this.getDebugMetadata(userPluginId.source, userPluginId.pluginId);
    if (err) {
      return failureResult(err);
    }
    if (metadata.pluginId !== userPluginId.pluginId) {
      return failureResult({
        en: 'Debug plugin not found',
        'zh-CN': '调试插件不存在'
      });
    }

    return successResult(toPlugin(metadata, userPluginId.source));
  }

  async listVersions({
    pluginId,
    source
  }: PluginVersionListInputType): Promise<Result<PluginVersionListOutputType>> {
    if (!isPluginDebugSource(source)) {
      return this.deps.fallback.listVersions({ pluginId, source });
    }

    const [metadata, err] = await this.getDebugMetadata(source, pluginId);
    if (err) {
      return failureResult(err);
    }
    if (metadata.pluginId !== pluginId) {
      return successResult([]);
    }

    return successResult([
      PluginVersionItemSchema.parse({
        version: metadata.version
      })
    ]);
  }

  async list(arg: PluginListInputType): Promise<Result<PluginListOutputType>> {
    const { debugSources, fallbackSources } = splitSources(arg.sources);
    if (debugSources.length === 0) {
      return this.deps.fallback.list(arg);
    }

    const [fallbackItems, fallbackErr] =
      fallbackSources.length > 0
        ? await this.deps.fallback.list({ ...arg, sources: fallbackSources })
        : successResult<PluginListOutputType>([]);
    if (fallbackErr) {
      return failureResult(fallbackErr);
    }

    const debugItems = await this.listDebugPlugins(debugSources);
    return successResult([...fallbackItems, ...debugItems.map(toPluginListItem)]);
  }

  async listToolSummaries(arg: ToolListInputType): Promise<Result<ToolListOutputType>> {
    const { debugSources, fallbackSources } = splitSources(arg.sources);
    if (debugSources.length === 0) {
      return this.deps.fallback.listToolSummaries(arg);
    }

    const [fallbackItems, fallbackErr] =
      fallbackSources.length > 0
        ? await this.deps.fallback.listToolSummaries({ ...arg, sources: fallbackSources })
        : successResult<ToolListOutputType>([]);
    if (fallbackErr) {
      return failureResult(fallbackErr);
    }

    const debugItems = await this.listDebugPlugins(debugSources);
    return successResult([...fallbackItems, ...debugItems.map(toToolListItem)]);
  }

  listActive(): Promise<Result<PluginType[]>> {
    return this.deps.fallback.listActive();
  }

  disablePlugins(uniqueIds: PluginUniqueIdType[]): Promise<Result> {
    return this.deps.fallback.disablePlugins(uniqueIds);
  }

  pruneDisabled(): ReturnType<PluginRepoPort['pruneDisabled']> {
    return this.deps.fallback.pruneDisabled();
  }

  listTags(): ReturnType<PluginRepoPort['listTags']> {
    return this.deps.fallback.listTags();
  }

  getPluginFileAccessURL(
    uniqueId: PluginUniqueIdType,
    filePath: string[],
    pending: boolean
  ): ReturnType<PluginRepoPort['getPluginFileAccessURL']> {
    return this.deps.fallback.getPluginFileAccessURL(uniqueId, filePath, pending);
  }

  private async listDebugPlugins(sources: string[]) {
    const results = (
      await Promise.all(
        sources.map(async (source) => {
          const [metadata, err] = await this.listDebugMetadata(source);
          return err ? [] : metadata.map((item) => ({ source, metadata: item }));
        })
      )
    ).flat();

    return results;
  }

  private async listDebugMetadata(source: string): Promise<Result<DebugPluginMetadata[]>> {
    const [value, err] = await this.getDebugMetadataValue(source);
    if (err) {
      return [null, err];
    }

    return successResult(pickDebugMetadataList(value, source));
  }

  private async getDebugMetadata(
    source: string,
    pluginId?: string
  ): Promise<Result<DebugPluginMetadata>> {
    const [value, err] = await this.getDebugMetadataValue(source);
    if (err) {
      return [null, err];
    }

    const metadata = pickDebugMetadata(value, source, pluginId);
    if (!metadata) {
      return failureResult({
        en: `Debug plugin metadata not found: ${source}`,
        'zh-CN': `调试插件元数据不存在: ${source}`
      });
    }

    return successResult(metadata);
  }

  private async getDebugMetadataValue(
    source: string
  ): Promise<Result<DebugPluginMetadata | DebugPluginMetadataBundle | undefined>> {
    try {
      const response = await fetch(
        `${this.gatewayBaseUrl}/internal/sessions/by-source/${encodeURIComponent(source)}/status`,
        {
          headers: {
            Authorization: `Bearer ${this.deps.authToken}`
          }
        }
      );
      const text = await response.text();
      if (!response.ok) {
        return failureResult(
          createError(ErrorCode.connectionGatewaySessionNotFound, {
            message: `Debug plugin session lookup failed: ${source}`,
            reason: {
              en: `Debug plugin session lookup failed: ${source}`,
              'zh-CN': `调试插件会话查询失败: ${source}`
            },
            data: {
              source,
              gatewayBaseUrl: this.gatewayBaseUrl,
              gatewayStatus: response.status,
              gatewayResponse: truncateText(text, 500)
            }
          })
        );
      }

      const payload = JSON.parse(text) as GatewayStatusResponse;
      if (!payload.data.session || payload.data.session.status !== 'connected' || payload.data.ownerAlive !== true) {
        return failureResult(
          createError(ErrorCode.connectionGatewaySessionNotFound, {
            message: `Debug plugin session is not connected: ${source}`,
            reason: {
              en: `Debug plugin session is not connected: ${source}`,
              'zh-CN': `调试插件会话未连接: ${source}`
            },
            data: {
              source,
              status: payload.data.session?.status,
              ownerAlive: payload.data.ownerAlive
            }
          })
        );
      }

      return successResult(payload.data.session?.metadata?.pluginDebug);
    } catch (error) {
      return failureResult(
        {
          en: 'Failed to get debug plugin metadata',
          'zh-CN': '获取调试插件元数据失败'
        },
        error
      );
    }
  }

  private get gatewayBaseUrl(): string {
    return this.deps.gatewayBaseUrl.replace(/\/+$/, '');
  }
}

function pickDebugMetadataList(
  value: DebugPluginMetadata | DebugPluginMetadataBundle | undefined,
  source: string
): DebugPluginMetadata[] {
  if (!value) {
    return [];
  }

  if ('targets' in value) {
    return value.targets.filter((target) => target.source === source);
  }

  return value.source === source ? [value] : [];
}

function pickDebugMetadata(
  value: DebugPluginMetadata | DebugPluginMetadataBundle | undefined,
  source: string,
  pluginId?: string
): DebugPluginMetadata | undefined {
  if (!value) {
    return undefined;
  }

  if ('targets' in value) {
    return value.targets.find(
      (target) => target.source === source && (!pluginId || target.pluginId === pluginId)
    );
  }

  if (value.source !== source) {
    return undefined;
  }

  if (pluginId && value.pluginId !== pluginId) {
    return undefined;
  }

  return value;
}

function truncateText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function toPlugin(metadata: DebugPluginMetadata, source: string): PluginType {
  return ToolSchema.parse({
    pluginId: metadata.pluginId,
    version: metadata.version,
    etag: toDebugEtag(source, metadata),
    type: PluginTypeEnum.tool,
    author: metadata.author,
    name: toI18n(metadata.name),
    icon: '',
    description: toI18n(metadata.description),
    tags: metadata.tags,
    permission: metadata.permissions,
    toolDescription: metadata.toolDescription,
    secretSchema: metadata.secretSchema,
    inputSchema: metadata.isToolSet ? undefined : metadata.tools[0]?.inputSchema,
    outputSchema: metadata.isToolSet ? undefined : metadata.tools[0]?.outputSchema,
    children: metadata.isToolSet
      ? metadata.tools.map((tool) => ({
          id: tool.id,
          name: toI18n(tool.name),
          description: toI18n(tool.description),
          icon: '',
          toolDescription: tool.toolDescription,
          inputSchema: tool.inputSchema,
          outputSchema: tool.outputSchema
        }))
      : undefined
  });
}

function splitSources(sources: PluginSourceType[] | undefined): {
  debugSources: string[];
  fallbackSources: PluginSourceType[];
} {
  return {
    debugSources: (sources ?? []).filter(isPluginDebugSource),
    fallbackSources: (sources ?? []).filter((source) => !isPluginDebugSource(source))
  };
}

function toPluginListItem({ source, metadata }: { source: string; metadata: DebugPluginMetadata }) {
  return PluginListItemSchema.parse({
    pluginId: metadata.pluginId,
    version: metadata.version,
    etag: toDebugEtag(source, metadata),
    type: PluginTypeEnum.tool,
    author: metadata.author,
    name: toI18n(metadata.name),
    icon: '',
    description: toI18n(metadata.description),
    tags: metadata.tags,
    source
  });
}

function toToolListItem({ source, metadata }: { source: string; metadata: DebugPluginMetadata }) {
  return ToolListItemSchema.parse({
    pluginId: metadata.pluginId,
    version: metadata.version,
    etag: toDebugEtag(source, metadata),
    type: PluginTypeEnum.tool,
    author: metadata.author,
    name: toI18n(metadata.name),
    icon: '',
    description: toI18n(metadata.description),
    tags: metadata.tags,
    toolDescription: metadata.toolDescription,
    source,
    isToolset: metadata.isToolSet,
    hasSecret: Boolean(
      metadata.secretSchema?.properties &&
        Object.keys(metadata.secretSchema.properties as Record<string, unknown>).length > 0
    ),
    children: metadata.isToolSet
      ? metadata.tools.map((tool) => ({
          id: tool.id,
          name: toI18n(tool.name),
          description: toI18n(tool.description),
          toolDescription: tool.toolDescription
        }))
      : undefined
  });
}

function toI18n(value: string) {
  return {
    en: value,
    'zh-CN': value
  };
}

function toDebugEtag(source: string, metadata: DebugPluginMetadata): string {
  const digest = createHash('sha256')
    .update(
      stableStringify({
        source,
        pluginId: metadata.pluginId,
        version: metadata.version,
        name: metadata.name,
        description: metadata.description,
        toolDescription: metadata.toolDescription,
        author: metadata.author,
        tags: metadata.tags,
        permissions: metadata.permissions,
        secretSchema: metadata.secretSchema,
        isToolSet: metadata.isToolSet,
        tools: metadata.tools
      })
    )
    .digest('base64url')
    .slice(0, 24);

  return `debug-${digest}`;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortJsonValue(item)])
    );
  }

  return value;
}
