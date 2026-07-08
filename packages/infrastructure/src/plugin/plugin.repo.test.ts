import path from 'node:path';
import { Readable } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import { type PluginType } from '@domain/entities/plugin.entity';
import { PluginStatusEnum } from '@domain/entities/plugin-base.entity';
import type { FileObject } from '@domain/value-objects/file/file-object.vo';
import { type PkgContentFileObjects } from '@domain/value-objects/file/pkg-file.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';

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

const fileObject = (fileKey: string, fileName = `${fileKey}.js`) =>
  ({
    metaData: {
      fileKey,
      fileName,
      contentType: 'application/javascript',
      size: 3,
      etag: `${fileKey}-etag`,
      createTime: new Date('2026-01-01T00:00:00Z')
    },
    get fileStream() {
      return Promise.resolve(successResult(Readable.from(['pkg'])));
    }
  }) as FileObject;

const files = () =>
  ({
    index: fileObject('index', 'index.js')
  }) as PkgContentFileObjects;

describe('PluginRepo.createPlugin', () => {
  it('serializes JSON Schema fields before storing plugin records', () => {
    (PluginRepo as any)._instance = undefined;

    const inputSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      $defs: {
        keyword: {
          type: 'string'
        }
      },
      properties: {
        schema: {
          type: 'string'
        },
        query: {
          $ref: '#/$defs/keyword'
        }
      }
    };
    const outputSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object'
    };
    const secretSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object'
    };
    const childInputSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      properties: {
        query: {
          $ref: '#/$defs/keyword'
        }
      }
    };
    const childOutputSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema'
    };
    const repo = PluginRepo.getInstance({} as PluginRepoDeps);
    const record = (repo as any).toPluginRecord({
      ...plugin(),
      inputSchema,
      outputSchema,
      secretSchema,
      children: [
        {
          id: 'search',
          name: { en: 'Search', 'zh-CN': 'Search' },
          description: { en: 'Search', 'zh-CN': 'Search' },
          icon: 'https://example.com/search.svg',
          toolDescription: 'Search',
          inputSchema: childInputSchema,
          outputSchema: childOutputSchema
        }
      ]
    });

    expect(record.data.inputSchema).toBe(JSON.stringify(inputSchema));
    expect(record.data.outputSchema).toBe(JSON.stringify(outputSchema));
    expect(record.data.secretSchema).toBe(JSON.stringify(secretSchema));
    expect(record.data.children[0].inputSchema).toBe(JSON.stringify(childInputSchema));
    expect(record.data.children[0].outputSchema).toBe(JSON.stringify(childOutputSchema));
  });

  it('deserializes stored JSON Schema fields when reading plugin records', () => {
    (PluginRepo as any)._instance = undefined;

    const inputSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      $defs: {
        keyword: {
          type: 'string'
        }
      },
      properties: {
        schema: {
          type: 'string'
        },
        ref: {
          type: 'string'
        },
        query: {
          $ref: '#/$defs/keyword'
        }
      }
    };
    const outputSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object'
    };
    const secretSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object'
    };
    const childInputSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object'
    };
    const childOutputSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object'
    };
    const repo = PluginRepo.getInstance({} as PluginRepoDeps);
    const domainPlugin = (repo as any).toDomainPlugin({
      ...pluginRecord(),
      data: {
        ...pluginRecord().data,
        inputSchema: JSON.stringify(inputSchema),
        outputSchema: JSON.stringify(outputSchema),
        secretSchema: JSON.stringify(secretSchema),
        children: [
          {
            id: 'search',
            name: { en: 'Search', 'zh-CN': 'Search' },
            description: { en: 'Search', 'zh-CN': 'Search' },
            icon: 'https://example.com/search.svg',
            toolDescription: 'Search',
            inputSchema: JSON.stringify(childInputSchema),
            outputSchema: JSON.stringify(childOutputSchema)
          }
        ]
      }
    });

    expect(domainPlugin.inputSchema).toEqual(inputSchema);
    expect(domainPlugin.outputSchema).toEqual(outputSchema);
    expect(domainPlugin.secretSchema).toEqual(secretSchema);
    expect(domainPlugin.children?.[0].inputSchema).toEqual(childInputSchema);
    expect(domainPlugin.children?.[0].outputSchema).toEqual(childOutputSchema);
  });

  it('restores a disabled plugin with the same version and etag to pending without rewriting files', async () => {
    (PluginRepo as any)._instance = undefined;

    const updateOne = vi.fn().mockResolvedValue({ modifiedCount: 1 });
    const pluginModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'existing-plugin',
          status: PluginStatusEnum.disabled
        })
      }),
      updateOne
    };
    const privateSave = vi.fn();
    const publicSave = vi.fn();
    const repo = PluginRepo.getInstance({
      mongoClient: {
        getModel: vi.fn().mockReturnValue(pluginModel)
      },
      privateRemoteFileStorageRepo: {
        save: privateSave
      },
      publicRemoteFileStorageRepo: {
        save: publicSave
      }
    } as unknown as PluginRepoDeps);

    const [, err] = await repo.createPlugin({
      plugin: plugin(),
      files: {} as PkgContentFileObjects,
      pending: true
    });

    expect(err).toBeNull();
    expect(updateOne).toHaveBeenCalledWith(
      {
        pluginId: 'plugin-a',
        version: '1.0.0',
        etag: 'etag-a'
      },
      {
        $set: {
          status: PluginStatusEnum.pending,
          updateAt: expect.any(Date)
        },
        $unset: {
          expiredAt: 1
        }
      }
    );
    expect(privateSave).not.toHaveBeenCalled();
    expect(publicSave).not.toHaveBeenCalled();
  });

  it('restores a disabled plugin with the same version and etag to active during direct installation', async () => {
    (PluginRepo as any)._instance = undefined;

    const session = { id: 'session' };
    const sessionRun = vi.fn(async (fn: (session: unknown) => Promise<unknown>) => fn(session));
    const updateOne = vi.fn().mockResolvedValue({ modifiedCount: 1 });
    const pluginModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'existing-plugin',
          status: PluginStatusEnum.disabled
        })
      }),
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            pluginId: 'plugin-a',
            version: '1.0.0',
            etag: 'old-etag'
          }
        ])
      }),
      updateMany: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      updateOne
    };
    const installationModel = {
      deleteMany: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 })
    };
    const privateSave = vi.fn().mockResolvedValue(successResult(fileObject('stored-index')));
    const publicSave = vi.fn();
    const repo = PluginRepo.getInstance({
      mongoClient: {
        sessionRun,
        getModel: vi.fn((modelName: string) =>
          modelName === 'pluginInstallation' ? installationModel : pluginModel
        )
      },
      privateRemoteFileStorageRepo: {
        save: privateSave
      },
      publicRemoteFileStorageRepo: {
        save: publicSave
      }
    } as unknown as PluginRepoDeps);

    const [, err] = await repo.createPlugin({
      plugin: plugin(),
      files: files(),
      pending: false
    });

    expect(err).toBeNull();
    expect(sessionRun).toHaveBeenCalledTimes(1);
    expect(privateSave.mock.invocationCallOrder[0]).toBeLessThan(
      sessionRun.mock.invocationCallOrder[0]
    );
    expect(updateOne).toHaveBeenCalledWith(
      {
        pluginId: 'plugin-a',
        version: '1.0.0',
        etag: 'etag-a'
      },
      {
        $set: expect.objectContaining({
          pluginId: 'plugin-a',
          version: '1.0.0',
          etag: 'etag-a',
          status: PluginStatusEnum.active,
          updateAt: expect.any(Date)
        }),
        $unset: {
          expiredAt: 1
        }
      },
      {
        session
      }
    );
    expect(privateSave).toHaveBeenCalledWith(
      expect.objectContaining({
        fileKey: 'plugin-a/1.0.0/etag-a/index.js',
        fileName: 'index.js'
      })
    );
    expect(publicSave).not.toHaveBeenCalled();
    expect(pluginModel.find).toHaveBeenCalledWith(
      {
        pluginId: 'plugin-a',
        version: '1.0.0',
        etag: {
          $ne: 'etag-a'
        },
        status: PluginStatusEnum.active
      },
      {
        _id: 0,
        pluginId: 1,
        version: 1,
        etag: 1
      },
      {
        session
      }
    );
    expect(pluginModel.updateMany).toHaveBeenCalledWith(
      {
        $or: [
          {
            pluginId: 'plugin-a',
            version: '1.0.0',
            etag: 'old-etag'
          }
        ]
      },
      {
        $set: {
          status: PluginStatusEnum.disabled,
          updateAt: expect.any(Date)
        },
        $unset: {
          expiredAt: 1
        }
      },
      {
        session
      }
    );
    expect(installationModel.deleteMany).toHaveBeenCalledWith(
      {
        $or: [
          {
            pluginId: 'plugin-a',
            version: '1.0.0',
            etag: 'old-etag'
          }
        ]
      },
      {
        session
      }
    );
    expect(installationModel.updateOne).toHaveBeenCalledWith(
      {
        source: 'system',
        pluginId: 'plugin-a',
        version: '1.0.0'
      },
      {
        $set: {
          etag: 'etag-a',
          pluginObjectId: 'existing-plugin'
        }
      },
      {
        upsert: true,
        session
      }
    );
  });

  it('keeps restored disabled plugin unchanged when direct installation file upload fails', async () => {
    (PluginRepo as any)._instance = undefined;

    const sessionRun = vi.fn();
    const pluginModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'existing-plugin',
          status: PluginStatusEnum.disabled
        })
      }),
      find: vi.fn(),
      updateMany: vi.fn(),
      updateOne: vi.fn()
    };
    const installationModel = {
      deleteMany: vi.fn(),
      updateOne: vi.fn()
    };
    const privateSave = vi
      .fn()
      .mockResolvedValue(failureResult({ en: 'save failed', 'zh-CN': '保存失败' }));
    const repo = PluginRepo.getInstance({
      mongoClient: {
        sessionRun,
        getModel: vi.fn((modelName: string) =>
          modelName === 'pluginInstallation' ? installationModel : pluginModel
        )
      },
      privateRemoteFileStorageRepo: {
        save: privateSave
      },
      publicRemoteFileStorageRepo: {
        save: vi.fn()
      }
    } as unknown as PluginRepoDeps);

    const [, err] = await repo.createPlugin({
      plugin: plugin(),
      files: files(),
      pending: false
    });

    expect(err?.reason).toEqual({
      en: 'upload temp file error',
      'zh-CN': '上传临时文件错误'
    });
    expect(privateSave).toHaveBeenCalledWith(
      expect.objectContaining({
        fileKey: 'plugin-a/1.0.0/etag-a/index.js',
        fileName: 'index.js'
      })
    );
    expect(sessionRun).not.toHaveBeenCalled();
    expect(pluginModel.updateOne).not.toHaveBeenCalled();
    expect(pluginModel.find).not.toHaveBeenCalled();
    expect(pluginModel.updateMany).not.toHaveBeenCalled();
    expect(installationModel.deleteMany).not.toHaveBeenCalled();
    expect(installationModel.updateOne).not.toHaveBeenCalled();
  });

  it('reports same version and etag when uploading an already installed plugin', async () => {
    (PluginRepo as any)._instance = undefined;

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

describe('PluginRepo.disablePlugins', () => {
  it('disables plugins and removes matching installation records', async () => {
    (PluginRepo as any)._instance = undefined;

    const uniqueId = {
      pluginId: 'plugin-a',
      version: '1.0.0',
      etag: 'etag-a'
    };
    const pluginModel = {
      updateMany: vi.fn()
    };
    const pluginInstallationModel = {
      deleteMany: vi.fn()
    };
    const repo = PluginRepo.getInstance({
      mongoClient: {
        getModel: vi.fn((modelName: string) =>
          modelName === 'pluginInstallation' ? pluginInstallationModel : pluginModel
        )
      }
    } as unknown as PluginRepoDeps);

    const [, err] = await repo.disablePlugins([uniqueId]);

    expect(err).toBeNull();
    expect(pluginModel.updateMany).toHaveBeenCalledWith(
      {
        $or: [uniqueId]
      },
      {
        $set: {
          status: PluginStatusEnum.disabled,
          updateAt: expect.any(Date)
        },
        $unset: {
          expiredAt: 1
        }
      }
    );
    expect(pluginInstallationModel.deleteMany).toHaveBeenCalledWith({
      $or: [
        {
          pluginId: uniqueId.pluginId,
          version: uniqueId.version,
          etag: uniqueId.etag
        }
      ]
    });
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
      },
      {
        source: 'system',
        pluginId: 'schema-only',
        version: '1.0.0',
        etag: 'etag-schema-only'
      }
    ];
    const makePluginRecord = (pluginId: string, etag: string, secretSchema?: unknown) => ({
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
        ...(secretSchema !== undefined ? { secretSchema: JSON.stringify(secretSchema) } : {})
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
      makePluginRecord('missing-secret', 'etag-missing'),
      makePluginRecord('schema-only', 'etag-schema-only', {
        type: 'object'
      })
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
        pluginId: 'schema-only',
        hasSecret: false
      }),
      expect.objectContaining({
        pluginId: 'with-secret',
        hasSecret: true
      })
    ]);
  });
});
