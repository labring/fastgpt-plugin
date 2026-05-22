import path from 'node:path';
import { Readable } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import { type PluginType } from '@domain/entities/plugin.entity';
import { PluginStatusEnum } from '@domain/entities/plugin-base.entity';
import { type PkgContentFileObjects } from '@domain/value-objects/file/pkg-file.vo';
import { successResult } from '@domain/value-objects/result.vo';

import { PluginRepo, type PluginRepoDeps } from './plugin.repo';

const plugin = (): PluginType =>
  ({
    pluginId: 'plugin-a',
    version: '1.0.0',
    etag: 'etag-a',
    type: 'tool',
    name: { en: 'Plugin A', 'zh-CN': 'Plugin A' },
    icon: 'https://example.com/icon.svg',
    description: { en: 'Plugin A', 'zh-CN': 'Plugin A' },
    toolDescription: 'Plugin A'
  }) as PluginType;

const pluginRecord = () => {
  const { toolDescription, inputSchema, outputSchema, secretSchema, children, ...base } = plugin();

  return {
    ...base,
    data: {
      toolDescription,
      inputSchema,
      outputSchema,
      secretSchema,
      children
    }
  };
};

describe('PluginRepo.createPlugin', () => {
  it('reports same version and etag when uploading an already installed plugin', async () => {
    const pluginModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'existing-plugin',
          status: PluginStatusEnum.active
        })
      })
    };
    const repo = PluginRepo.getInstance({
      mongoClient: {
        getModel: vi.fn().mockReturnValue(pluginModel)
      }
    } as unknown as PluginRepoDeps);

    const [, err] = await repo.createPlugin({
      plugin: plugin(),
      files: {} as PkgContentFileObjects,
      pending: true
    });

    expect(err?.reason).toEqual({
      en: 'Plugin with the same version and etag already exists',
      'zh-CN': '已存在相同版本且 etag 相同的插件'
    });
  });
});

describe('PluginRepo.getPluginById', () => {
  it('caches the runtime entry under plugin/pluginId/version/etag while reading remote storage from the published key', async () => {
    (PluginRepo as any)._instance = undefined;

    const uniqueId = {
      pluginId: 'plugin-a',
      version: '1.0.0',
      etag: 'etag-a'
    };
    const indexBuffer = Buffer.from('export default {};');
    const remoteIndexFile = {
      metaData: {
        fileKey: 'plugin-a/1.0.0/etag-a/index.js',
        fileName: 'index.js',
        contentType: 'application/javascript',
        size: indexBuffer.length,
        etag: 'index-etag',
        createTime: new Date('2026-01-01T00:00:00Z')
      },
      get fileStream() {
        return Promise.resolve(successResult(Readable.from([indexBuffer])));
      }
    };
    const pluginModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(pluginRecord())
      })
    };
    const basePath = path.join('/tmp', 'fastgpt-plugin-runtime');
    const exists = vi.fn().mockResolvedValue(successResult(false));
    const save = vi.fn(async ({ fileKey }: { fileKey: string }) =>
      successResult({
        metaData: {
          ...remoteIndexFile.metaData,
          fileKey
        }
      })
    );
    const getFileObject = vi.fn().mockResolvedValue(successResult(remoteIndexFile));
    const repo = PluginRepo.getInstance({
      mongoClient: {
        getModel: vi.fn().mockReturnValue(pluginModel)
      },
      localFileStorageRepo: {
        exists,
        save,
        joinPath: (...segments: string[]) => path.join(basePath, ...segments)
      },
      privateRemoteFileStorageRepo: {
        getFileObject
      }
    } as unknown as PluginRepoDeps);

    const [result, err] = await repo.getPluginById(uniqueId);

    expect(err).toBeNull();
    expect(getFileObject).toHaveBeenCalledWith('plugin-a/1.0.0/etag-a/index.js');
    expect(exists).toHaveBeenCalledWith('plugin/plugin-a/1.0.0/etag-a/index.js');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        fileKey: 'plugin/plugin-a/1.0.0/etag-a/index.js',
        fileName: 'index.js'
      })
    );
    expect(result?.entryFilePath).toBe(
      path.join(basePath, 'plugin/plugin-a/1.0.0/etag-a/index.js')
    );
  });
});

describe('PluginRepo.listToolSummaries', () => {
  it('returns hasSecret based on whether secretSchema has configured fields', async () => {
    (PluginRepo as any)._instance = undefined;

    const installedPlugins = [
      {
        source: 'system',
        pluginId: 'with-secret',
        version: '1.0.0',
        etag: 'etag-secret'
      },
      {
        source: 'system',
        pluginId: 'empty-secret',
        version: '1.0.0',
        etag: 'etag-empty'
      },
      {
        source: 'system',
        pluginId: 'missing-secret',
        version: '1.0.0',
        etag: 'etag-missing'
      }
    ];
    const makePluginRecord = (
      pluginId: string,
      etag: string,
      secretSchema?: Record<string, unknown>
    ) => ({
      pluginId,
      version: '1.0.0',
      etag,
      type: 'tool',
      name: { en: pluginId, 'zh-CN': pluginId },
      icon: 'https://example.com/icon.svg',
      description: { en: pluginId, 'zh-CN': pluginId },
      tags: ['tools'],
      status: PluginStatusEnum.active,
      data: {
        toolDescription: pluginId,
        ...(secretSchema !== undefined ? { secretSchema } : {})
      }
    });
    const pluginRecords = [
      makePluginRecord('with-secret', 'etag-secret', {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string'
          }
        }
      }),
      makePluginRecord('empty-secret', 'etag-empty', {
        type: 'object',
        properties: {}
      }),
      makePluginRecord('missing-secret', 'etag-missing')
    ];
    const pluginInstallationModel = {
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(installedPlugins)
      })
    };
    const pluginModel = {
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(pluginRecords)
      })
    };
    const repo = PluginRepo.getInstance({
      mongoClient: {
        getModel: vi.fn((modelName: string) =>
          modelName === 'pluginInstallation' ? pluginInstallationModel : pluginModel
        )
      }
    } as unknown as PluginRepoDeps);

    const [tools, err] = await repo.listToolSummaries({});

    expect(err).toBeNull();
    expect(pluginModel.find).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        'data.secretSchema': 1
      })
    );
    expect(tools).toEqual([
      expect.objectContaining({
        pluginId: 'empty-secret',
        hasSecret: false
      }),
      expect.objectContaining({
        pluginId: 'missing-secret',
        hasSecret: false
      }),
      expect.objectContaining({
        pluginId: 'with-secret',
        hasSecret: true
      })
    ]);
  });
});
