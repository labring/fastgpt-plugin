import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import { successResult } from '@domain/value-objects/result.vo';

import { DebugPluginRepoOverlay } from './debug-plugin.repo';

describe('DebugPluginRepoOverlay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('selects plugin metadata by pluginId under one debug source', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(makeGatewayStatus()));
    const repo = createRepo();

    const [plugin, err] = await repo.getPluginByUserPluginId({
      pluginId: 'dbops',
      source: 'debug:user:u1'
    });

    expect(err).toBeNull();
    expect(plugin).toMatchObject({
      pluginId: 'dbops',
      version: '0.2.0'
    });
  });

  it('lists all debug plugins mounted under one source', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(makeGatewayStatus()));
    const repo = createRepo();

    const [plugins, err] = await repo.list({
      sources: ['debug:user:u1']
    });

    expect(err).toBeNull();
    expect(plugins?.map((plugin) => plugin.pluginId)).toEqual(['getTime', 'dbops']);
    expect(new Set(plugins?.map((plugin) => plugin.etag)).size).toBe(2);
  });

  it('changes debug etag when mounted metadata changes without a version bump', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(makeGatewayStatus()))
      .mockResolvedValueOnce(
        jsonResponse(
          makeGatewayStatus({
            metadataOverrides: {
              getTime: {
                toolDescription: 'changed tool description'
              }
            }
          })
        )
      );
    const repo = createRepo();

    const [before, beforeErr] = await repo.list({
      sources: ['debug:user:u1']
    });
    const [after, afterErr] = await repo.list({
      sources: ['debug:user:u1']
    });

    expect(beforeErr).toBeNull();
    expect(afterErr).toBeNull();
    expect(before?.find((plugin) => plugin.pluginId === 'getTime')?.version).toBe('0.1.1');
    expect(after?.find((plugin) => plugin.pluginId === 'getTime')?.version).toBe('0.1.1');
    expect(before?.find((plugin) => plugin.pluginId === 'getTime')?.etag).not.toBe(
      after?.find((plugin) => plugin.pluginId === 'getTime')?.etag
    );
  });

  it('keeps debug etag stable when metadata key order changes', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(makeGatewayStatus()))
      .mockResolvedValueOnce(jsonResponse(makeGatewayStatus({ reverseMetadataKeyOrder: true })));
    const repo = createRepo();

    const [before] = await repo.list({
      sources: ['debug:user:u1']
    });
    const [after] = await repo.list({
      sources: ['debug:user:u1']
    });

    expect(before?.map((plugin) => plugin.etag)).toEqual(after?.map((plugin) => plugin.etag));
  });

  it('keeps fallback plugins when listing mixed normal and debug sources', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(makeGatewayStatus()));
    const fallback = makeFallbackRepo({
      plugins: [
        {
          pluginId: 'systemSearch',
          version: '1.0.0',
          etag: 'system-etag',
          type: 'tool',
          name: { en: 'System Search', 'zh-CN': 'System Search' },
          icon: '',
          source: 'system'
        }
      ]
    });
    const repo = createRepo({ fallback });

    const [plugins, err] = await repo.list({
      sources: ['system', 'debug:user:u1']
    });

    expect(err).toBeNull();
    expect(fallback.list).toHaveBeenCalledWith({ sources: ['system'] });
    expect(plugins?.map((plugin) => `${plugin.source}:${plugin.pluginId}`)).toEqual([
      'system:systemSearch',
      'debug:user:u1:getTime',
      'debug:user:u1:dbops'
    ]);
  });

  it('keeps fallback tool summaries when listing mixed normal and debug sources', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(makeGatewayStatus()));
    const fallback = makeFallbackRepo({
      tools: [
        {
          pluginId: 'systemTool',
          version: '1.0.0',
          etag: 'system-tool-etag',
          type: 'tool',
          name: { en: 'System Tool', 'zh-CN': 'System Tool' },
          icon: '',
          toolDescription: 'system tool',
          source: 'system',
          isToolset: false,
          hasSecret: false
        }
      ]
    });
    const repo = createRepo({ fallback });

    const [tools, err] = await repo.listToolSummaries({
      sources: ['system', 'debug:user:u1']
    });

    expect(err).toBeNull();
    expect(fallback.listToolSummaries).toHaveBeenCalledWith({ sources: ['system'] });
    expect(tools?.map((tool) => `${tool.source}:${tool.pluginId}`)).toEqual([
      'system:systemTool',
      'debug:user:u1:getTime',
      'debug:user:u1:dbops'
    ]);
  });

  it('keeps gateway lookup diagnostics when session lookup fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"error":"missing"}', { status: 404 })
    );
    const repo = createRepo();

    const [, err] = await repo.getPluginByUserPluginId({
      pluginId: 'getTime',
      source: 'debug:user:u1'
    });

    expect(err).toMatchObject({
      code: 'connection_gateway.session_not_found',
      data: {
        source: 'debug:user:u1',
        gatewayBaseUrl: 'http://gateway.local',
        gatewayStatus: 404
      }
    });
  });

  it('does not expose debug metadata from a disconnected session', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(makeGatewayStatus({ status: 'closed', ownerAlive: false }))
    );
    const repo = createRepo();

    const [, err] = await repo.getPluginByUserPluginId({
      pluginId: 'getTime',
      source: 'debug:user:u1'
    });

    expect(err).toMatchObject({
      code: 'connection_gateway.session_not_found',
      data: {
        source: 'debug:user:u1',
        status: 'closed',
        ownerAlive: false
      }
    });
  });

  it('does not expose debug metadata when gateway owner liveness is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(makeGatewayStatusWithoutOwnerAlive())
    );
    const repo = createRepo();

    const [, err] = await repo.getPluginByUserPluginId({
      pluginId: 'getTime',
      source: 'debug:user:u1'
    });

    expect(err).toMatchObject({
      code: 'connection_gateway.session_not_found',
      data: {
        source: 'debug:user:u1',
        status: 'connected'
      }
    });
  });
});

function createRepo(input: { fallback?: PluginRepoPort } = {}): DebugPluginRepoOverlay {
  return new DebugPluginRepoOverlay({
    fallback: input.fallback ?? makeFallbackRepo(),
    gatewayBaseUrl: 'http://gateway.local',
    authToken: 'token'
  });
}

function makeFallbackRepo({
  plugins = [],
  tools = []
}: {
  plugins?: unknown[];
  tools?: unknown[];
} = {}): PluginRepoPort {
  return {
    getPendingPluginIds: vi.fn().mockResolvedValue(successResult([])),
    createPlugin: vi.fn().mockResolvedValue(successResult({})),
    confirmPlugin: vi.fn(),
    deletePendingPlugin: vi.fn().mockResolvedValue(successResult({})),
    getPluginById: vi.fn(),
    getPluginsByPluginId: vi.fn().mockResolvedValue(successResult([])),
    getPluginByUserPluginId: vi.fn(),
    listVersions: vi.fn().mockResolvedValue(successResult([])),
    list: vi.fn().mockResolvedValue(successResult(plugins)),
    listToolSummaries: vi.fn().mockResolvedValue(successResult(tools)),
    listActive: vi.fn().mockResolvedValue(successResult([])),
    disablePlugins: vi.fn().mockResolvedValue(successResult({})),
    pruneDisabled: vi.fn().mockResolvedValue(successResult({ count: 0, plugins: [] })),
    listTags: vi.fn().mockResolvedValue(successResult([])),
    getPluginFileAccessURL: vi.fn()
  } as unknown as PluginRepoPort;
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function makeGatewayStatus({
  status = 'connected',
  ownerAlive = true,
  metadataOverrides = {},
  reverseMetadataKeyOrder = false
}: {
  status?: string;
  ownerAlive?: boolean;
  metadataOverrides?: Record<string, Partial<ReturnType<typeof makeMetadata>>>;
  reverseMetadataKeyOrder?: boolean;
} = {}) {
  return {
    data: {
      session: {
        id: 'session-a',
        status,
        sessionScope: {
          source: 'debug:user:u1'
        },
        metadata: {
          pluginDebug: {
            targets: [
              makeMetadata('getTime', '0.1.1', {
                override: metadataOverrides.getTime,
                reverseKeyOrder: reverseMetadataKeyOrder
              }),
              makeMetadata('dbops', '0.2.0', {
                override: metadataOverrides.dbops,
                reverseKeyOrder: reverseMetadataKeyOrder
              })
            ]
          }
        }
      },
      ownerAlive
    }
  };
}

function makeGatewayStatusWithoutOwnerAlive() {
  const status = makeGatewayStatus();
  delete (status.data as Partial<{ ownerAlive: boolean }>).ownerAlive;
  return status;
}

function makeMetadata(
  pluginId: string,
  version: string,
  {
    override = {},
    reverseKeyOrder = false
  }: { override?: Partial<ReturnType<typeof makeMetadataBase>>; reverseKeyOrder?: boolean } = {}
) {
  const metadata = {
    ...makeMetadataBase(pluginId, version),
    ...override
  };

  if (!reverseKeyOrder) {
    return metadata;
  }

  return Object.fromEntries(Object.entries(metadata).reverse()) as ReturnType<
    typeof makeMetadataBase
  >;
}

function makeMetadataBase(pluginId: string, version: string) {
  return {
    source: 'debug:user:u1',
    pluginId,
    version,
    name: pluginId,
    description: `${pluginId} description`,
    toolDescription: `${pluginId} tool`,
    tags: ['tools'],
    permissions: [],
    secretSchema: {},
    isToolSet: false,
    tools: [
      {
        id: pluginId,
        name: pluginId,
        description: `${pluginId} description`,
        toolDescription: `${pluginId} tool`,
        inputSchema: {},
        outputSchema: {}
      }
    ]
  };
}
