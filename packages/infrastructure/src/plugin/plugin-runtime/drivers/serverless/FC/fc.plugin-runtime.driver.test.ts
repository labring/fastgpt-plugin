import { Readable } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import { FileObject } from '@domain/value-objects/file/file-object.vo';
import { successResult } from '@domain/value-objects/result.vo';

import { FCPluginRuntimeManager } from './fc.plugin-runtime.driver';
import type { FCFunctionProvider } from './types';

const pluginRuntimeConfigModel = {
  findOne: vi.fn(() => ({ lean: vi.fn(async () => null) })),
  updateOne: vi.fn(async () => {}),
  deleteOne: vi.fn(async () => {})
};

const mongoClient = {
  getModel: vi.fn(() => pluginRuntimeConfigModel)
};

const redisClient = {
  getClient: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => undefined)
  }
};

const uniqueId = { pluginId: 'getTime', version: '1.0.0', etag: 'abc' };

describe('FCPluginRuntimeManager', () => {
  it('registers plugin through artifact repo and function provider', async () => {
    const artifactRepo = {
      ensureArtifact: vi.fn(async () =>
        successResult({
          bucket: 'bucket',
          key: 'plugin-runtime/getTime/1.0.0/abc/index.js',
          existed: false,
          etag: 'artifact-etag',
          size: 10
        })
      )
    };
    const provider = createProvider();
    const manager = createManager({ artifactRepo, provider });

    const [, err] = await manager.register(uniqueId);

    expect(err).toBeNull();
    expect(artifactRepo.ensureArtifact).toHaveBeenCalled();
    expect(provider.ensureFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        runtimeId: 'fc@getTime@1.0.0@abc',
        artifact: expect.objectContaining({ bucket: 'bucket' })
      })
    );
    await manager.shutdown();
  });

  it('invokes registered functions and exposes metrics', async () => {
    const provider = createProvider({
      invoke: vi.fn(async () => ({
        frames: [{ type: 'response' as const, data: { ok: true } }]
      }))
    });
    const manager = createManager({ provider });
    await manager.register(uniqueId);

    const [result, err] = await manager.invoke({
      uniqueId,
      eventName: 'run',
      payload: { input: {} },
      returnStream: false
    });

    expect(err).toBeNull();
    expect(result).toEqual({ ok: true });

    const [metrics] = await manager.globalStatus();
    expect(metrics).toMatchObject({
      totalRequests: 1,
      totalFunctions: 1
    });
    await manager.shutdown();
  });
});

function createManager({
  artifactRepo = {
    ensureArtifact: vi.fn(async () =>
      successResult({
        bucket: 'bucket',
        key: 'plugin-runtime/getTime/1.0.0/abc/index.js',
        existed: false
      })
    )
  },
  provider = createProvider()
}: {
  artifactRepo?: any;
  provider?: FCFunctionProvider;
} = {}) {
  (FCPluginRuntimeManager as any).instance = undefined;
  return FCPluginRuntimeManager.getInstance({
    mongoClient: mongoClient as any,
    redisClient: redisClient as any,
    pluginRepo: {
      getPluginById: vi.fn(async () =>
        successResult({
          info: {
            pluginId: 'getTime',
            version: '1.0.0',
            etag: 'abc',
            type: 'tool'
          },
          indexFile: createFileObject(),
          entryFilePath: '/tmp/index.js'
        })
      )
    } as any,
    artifactRepo,
    functionProvider: provider
  });
}

function createProvider(overrides: Partial<FCFunctionProvider> = {}): FCFunctionProvider {
  const records = new Map<string, any>();
  return {
    getFunction: vi.fn(async (functionName) => records.get(functionName) ?? null),
    ensureFunction: vi.fn(async (definition) => {
      const record = {
        ...definition,
        updatedAt: Date.now(),
        state: 'active'
      };
      records.set(definition.functionName, record);
      return { state: 'created' as const, function: record };
    }),
    deleteFunction: vi.fn(async (functionName) => {
      records.delete(functionName);
    }),
    invoke: vi.fn(async () => ({ frames: [] })),
    ...overrides
  };
}

function createFileObject() {
  return new FileObject({
    metaData: {
      fileKey: 'index.js',
      fileName: 'index.js',
      contentType: 'application/javascript',
      createTime: new Date(0),
      etag: 'source-etag',
      size: 10
    },
    getBuffer: async () => successResult(Buffer.from('export default {}')),
    getReadStream: async () => successResult(Readable.from('export default {}'))
  });
}
