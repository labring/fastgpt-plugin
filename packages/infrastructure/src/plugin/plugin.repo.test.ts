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

const fileObject = (fileKey: string, fileName = fileKey) =>
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

const pkgFiles = () =>
  ({
    index: fileObject('index.js'),
    manifest: fileObject('manifest.json')
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

    const pluginModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'existing-plugin',
          status: PluginStatusEnum.disabled
        })
      }),
    };
    const installationModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      }),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 })
    };
    const privateSave = vi.fn();
    const publicSave = vi.fn();
    const repo = PluginRepo.getInstance({
      mongoClient: {
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
      files: {} as PkgContentFileObjects,
      pending: true
    });

    expect(err).toBeNull();
    expect(installationModel.updateOne).toHaveBeenCalledWith(
      {
        source: 'system',
        pluginId: 'plugin-a',
        version: '1.0.0'
      },
      {
        $set: {
          etag: 'etag-a',
          pluginObjectId: 'existing-plugin',
          status: PluginStatusEnum.pending,
          updatedAt: expect.any(Date),
          expiredAt: expect.any(Date)
        },
        $unset: {}
      },
      { upsert: true }
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
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      }),
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      }),
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
    expect(updateOne).toHaveBeenCalledWith(
      { pluginId: 'plugin-a', version: '1.0.0', etag: 'etag-a' },
      expect.objectContaining({
        $set: expect.objectContaining({ status: PluginStatusEnum.active }),
        $unset: { expiredAt: 1 }
      }),
      { session }
    );
    expect(privateSave).not.toHaveBeenCalled();
    expect(publicSave).not.toHaveBeenCalled();
    expect(pluginModel.find).toHaveBeenCalledWith(
      {
        $and: [
          {
            pluginId: 'plugin-a',
            version: '1.0.0',
            etag: {
              $ne: 'etag-a'
            }
          },
          {
            $or: [{ status: PluginStatusEnum.active }, { status: { $exists: false } }]
          }
        ]
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
    expect(installationModel.find).toHaveBeenCalledWith(
      {
        $and: [
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
            $or: [{ status: 'active' }, { status: { $exists: false } }]
          }
        ]
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
    expect(installationModel.updateOne).toHaveBeenCalledWith(
      {
        source: 'system',
        pluginId: 'plugin-a',
        version: '1.0.0'
      },
      {
        $set: expect.objectContaining({
          etag: 'etag-a',
          pluginObjectId: 'existing-plugin',
          status: PluginStatusEnum.active,
          updatedAt: expect.any(Date)
        }),
        $unset: { expiredAt: 1 }
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
        lean: vi.fn().mockResolvedValue(null)
      }),
      find: vi.fn(),
      updateMany: vi.fn(),
      updateOne: vi.fn()
    };
    const installationModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      }),
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
      en: 'upload plugin file error',
      'zh-CN': '上传插件文件错误'
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
    const installationModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          source: 'system',
          pluginId: 'plugin-a',
          version: '1.0.0',
          etag: 'etag-a',
          status: PluginStatusEnum.active
        })
      })
    };
    const repo = PluginRepo.getInstance({
      mongoClient: {
        getModel: vi.fn((modelName: string) =>
          modelName === 'pluginInstallation' ? installationModel : pluginModel
        )
      }
    } as unknown as PluginRepoDeps);

    const [, err] = await repo.createPlugin({
      plugin: plugin(),
      files: {} as PkgContentFileObjects,
      pending: true
    });

    expect(err?.reason).toEqual({
      en: 'Plugin installation already exists for this source',
      'zh-CN': '该来源下已存在相同插件安装'
    });
  });

  it('rejects an installation with the same source and complete plugin identity', async () => {
    (PluginRepo as any)._instance = undefined;

    const pluginModel = {
      findOne: vi.fn(() => {
        throw new Error('plugin entity should not be queried for a duplicate installation');
      })
    };
    const pluginInstallationModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'installation',
          source: 'team-a',
          pluginId: 'plugin-a',
          version: '1.0.0',
          etag: 'etag-a'
        })
      })
    };
    const repo = PluginRepo.getInstance({
      mongoClient: {
        getModel: vi.fn((modelName: string) =>
          modelName === 'pluginInstallation' ? pluginInstallationModel : pluginModel
        )
      }
    } as unknown as PluginRepoDeps);

    const [, err] = await repo.createPlugin({
      plugin: plugin(),
      files: {} as PkgContentFileObjects,
      pending: false,
      source: 'team-a'
    });

    expect(err?.reason).toEqual({
      en: 'Plugin installation already exists for this source',
      'zh-CN': '该来源下已存在相同插件安装'
    });
    expect(pluginInstallationModel.findOne).toHaveBeenCalledWith({
      source: 'team-a',
      pluginId: 'plugin-a',
      version: '1.0.0',
      etag: 'etag-a'
    });
    expect(pluginModel.findOne).not.toHaveBeenCalled();
  });

  it('rejects a duplicate installation detected inside the final transaction', async () => {
    (PluginRepo as any)._instance = undefined;

    const pluginModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'existing-plugin', status: PluginStatusEnum.active })
      }),
      find: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      updateOne: vi.fn(),
      updateMany: vi.fn()
    };
    const pluginInstallationModel = {
      findOne: vi
        .fn()
        .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(null) })
        .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue({ etag: 'etag-a' }) }),
      updateOne: vi.fn()
    };
    const repo = PluginRepo.getInstance({
      mongoClient: {
        sessionRun: vi.fn(async (fn: (session: unknown) => Promise<unknown>) =>
          fn({ id: 'session' })
        ),
        getModel: vi.fn((modelName: string) =>
          modelName === 'pluginInstallation' ? pluginInstallationModel : pluginModel
        )
      },
      privateRemoteFileStorageRepo: {
        save: vi.fn().mockResolvedValue(successResult(fileObject('index.js')))
      },
      publicRemoteFileStorageRepo: {
        save: vi.fn().mockResolvedValue(successResult(fileObject('README.md')))
      }
    } as unknown as PluginRepoDeps);

    const [, err] = await repo.createPlugin({
      plugin: plugin(),
      files: pkgFiles(),
      pending: false,
      source: 'team-a'
    });

    expect(err?.reason).toEqual({
      en: 'Plugin installation already exists for this source',
      'zh-CN': '该来源下已存在相同插件安装'
    });
    expect(pluginInstallationModel.updateOne).not.toHaveBeenCalled();
  });

  it('reuses an active plugin runtime when another source installs the same identity', async () => {
    (PluginRepo as any)._instance = undefined;

    const session = { id: 'session' };
    const sessionRun = vi.fn(async (fn: (session: unknown) => Promise<unknown>) => fn(session));
    const pluginModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'existing-plugin',
          status: PluginStatusEnum.active
        })
      }),
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      }),
      updateMany: vi.fn()
    };
    const pluginInstallationModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      }),
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      }),
      updateOne: vi.fn()
    };
    const repo = PluginRepo.getInstance({
      mongoClient: {
        sessionRun,
        getModel: vi.fn((modelName: string) =>
          modelName === 'pluginInstallation' ? pluginInstallationModel : pluginModel
        )
      },
      privateRemoteFileStorageRepo: {
        save: vi.fn().mockResolvedValue(successResult(fileObject('index.js')))
      },
      publicRemoteFileStorageRepo: {
        save: vi.fn().mockResolvedValue(successResult(fileObject('README.md')))
      }
    } as unknown as PluginRepoDeps);

    const [result, err] = await repo.createPlugin({
      plugin: plugin(),
      files: pkgFiles(),
      pending: false,
      source: 'team-b'
    });

    expect(err).toBeNull();
    expect(result).toEqual({ runtimeRegistrationRequired: false });
    expect(pluginInstallationModel.updateOne).toHaveBeenCalledWith(
      {
        source: 'team-b',
        pluginId: 'plugin-a',
        version: '1.0.0'
      },
      {
        $set: {
          etag: 'etag-a',
          pluginObjectId: 'existing-plugin',
          status: PluginStatusEnum.active,
          updatedAt: expect.any(Date)
        },
        $unset: { expiredAt: 1 }
      },
      {
        upsert: true,
        session
      }
    );
  });

  it('keeps an existing source-aware pending upload ready without rewriting files', async () => {
    (PluginRepo as any)._instance = undefined;

    const pluginModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'existing-plugin', status: PluginStatusEnum.active })
      })
    };
    const installationModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'installation',
          source: 'team-a',
          pluginId: 'plugin-a',
          version: '1.0.0',
          etag: 'etag-a',
          status: 'pending'
        })
      }),
      updateOne: vi.fn().mockResolvedValue({})
    };
    const publicSave = vi.fn().mockResolvedValue(successResult(fileObject('saved')));
    const repo = PluginRepo.getInstance({
      mongoClient: {
        getModel: vi.fn((modelName: string) =>
          modelName === 'pluginInstallation' ? installationModel : pluginModel
        )
      },
      privateRemoteFileStorageRepo: {
        save: vi.fn().mockResolvedValue(successResult(fileObject('index.js'))),
        getBucketName: vi.fn().mockReturnValue('private'),
      },
      publicRemoteFileStorageRepo: {
        save: publicSave,
        getBucketName: vi.fn().mockReturnValue('public'),
      },
      fileTTLManager: {
        setExpiration: vi.fn().mockResolvedValue(successResult({}))
      }
    } as unknown as PluginRepoDeps);

    const [, err] = await repo.createPlugin({
      plugin: plugin(),
      files: {
        ...pkgFiles(),
        readme: fileObject('README.md'),
        logos: [fileObject('logo.png')]
      },
      pending: true,
      source: 'team-a'
    });

    expect(err).toBeNull();
    expect(publicSave).not.toHaveBeenCalled();
    expect(installationModel.updateOne).toHaveBeenCalledWith(
      { _id: 'installation' },
      { $set: { status: 'pending', expiredAt: expect.any(Date), updatedAt: expect.any(Date) } }
    );
  });

  it('writes installation records under the requested source and keeps referenced plugins active', async () => {
    (PluginRepo as any)._instance = undefined;

    const session = { id: 'session' };
    const sessionRun = vi.fn(async (fn: (session: unknown) => Promise<unknown>) => fn(session));
    const pluginModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
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
      updateMany: vi.fn(),
      updateOne: vi.fn(),
      create: vi.fn().mockResolvedValue({
        toObject: () => ({
          ...pluginRecord(),
          _id: 'created-plugin'
        })
      })
    };
    const pluginInstallationModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
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
      updateOne: vi.fn()
    };
    const privateSave = vi.fn().mockResolvedValue(successResult(fileObject('index.js')));
    const repo = PluginRepo.getInstance({
      mongoClient: {
        sessionRun,
        getModel: vi.fn((modelName: string) =>
          modelName === 'pluginInstallation' ? pluginInstallationModel : pluginModel
        )
      },
      privateRemoteFileStorageRepo: {
        save: privateSave
      },
      publicRemoteFileStorageRepo: {
        save: vi.fn().mockResolvedValue(successResult(fileObject('README.md')))
      }
    } as unknown as PluginRepoDeps);

    const [result, err] = await repo.createPlugin({
      plugin: plugin(),
      files: pkgFiles(),
      pending: false,
      source: 'team-a'
    });

    expect(err).toBeNull();
    expect(result).toEqual({ runtimeRegistrationRequired: true });
    expect(privateSave.mock.invocationCallOrder[0]).toBeLessThan(
      pluginModel.create.mock.invocationCallOrder[0]
    );
    expect(pluginInstallationModel.updateOne).toHaveBeenCalledWith(
      {
        source: 'team-a',
        pluginId: 'plugin-a',
        version: '1.0.0'
      },
      {
        $set: {
          etag: 'etag-a',
          pluginObjectId: 'created-plugin',
          status: PluginStatusEnum.active,
          updatedAt: expect.any(Date)
        },
        $unset: { expiredAt: 1 }
      },
      {
        upsert: true,
        session
      }
    );
    expect(pluginModel.updateMany).not.toHaveBeenCalled();
  });
});

describe('PluginRepo.getPendingPluginIds', () => {
  it('queries pending installation records by source', async () => {
    (PluginRepo as any)._instance = undefined;

    const installationModel = {
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { pluginId: 'team-plugin', version: '1.0.0', etag: 'team-etag' }
        ])
      })
    };
    const repo = PluginRepo.getInstance({
      mongoClient: {
        getModel: vi.fn((modelName: string) =>
          modelName === 'pluginInstallation' ? installationModel : {}
        )
      }
    } as unknown as PluginRepoDeps);

    const [teamIds, teamErr] = await repo.getPendingPluginIds('team-a');
    expect(teamErr).toBeNull();
    expect(teamIds).toEqual([{ pluginId: 'team-plugin', version: '1.0.0', etag: 'team-etag' }]);
    expect(installationModel.find).toHaveBeenCalledWith(
      { source: 'team-a', status: 'pending' },
      { _id: true, pluginId: true, version: true, etag: true }
    );
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

describe('PluginRepo.deletePluginInstallation', () => {
  it('removes only the requested source installation and keeps a shared plugin active', async () => {
    (PluginRepo as any)._instance = undefined;

    const pluginInstallationModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          pluginId: 'plugin-a',
          version: '1.0.0',
          etag: 'etag-a'
        })
      }),
      deleteOne: vi.fn(),
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            source: 'team-b',
            pluginId: 'plugin-a',
            version: '1.0.0',
            etag: 'etag-a'
          }
        ])
      })
    };
    const pluginModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(pluginRecord())
      }),
      updateMany: vi.fn()
    };
    const repo = PluginRepo.getInstance({
      mongoClient: {
        sessionRun: vi.fn(async (fn: (session: unknown) => Promise<unknown>) =>
          fn({ id: 'session' })
        ),
        getModel: vi.fn((modelName: string) =>
          modelName === 'pluginInstallation' ? pluginInstallationModel : pluginModel
        )
      }
    } as unknown as PluginRepoDeps);

    const [result, err] = await repo.deletePluginInstallation({
      pluginId: 'plugin-a',
      source: 'team-a',
      version: '1.0.0'
    });

    expect(err).toBeNull();
    expect(result?.disabled).toBe(false);
    expect(pluginInstallationModel.deleteOne).toHaveBeenCalledWith(
      {
        source: 'team-a',
        pluginId: 'plugin-a',
        version: '1.0.0',
        etag: 'etag-a'
      },
      { session: { id: 'session' } }
    );
    expect(pluginModel.updateMany).not.toHaveBeenCalled();
  });

  it('disables the plugin when the deleted source is the last installation', async () => {
    (PluginRepo as any)._instance = undefined;

    const pluginInstallationModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          pluginId: 'plugin-a',
          version: '1.0.0',
          etag: 'etag-a'
        })
      }),
      deleteOne: vi.fn(),
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      })
    };
    const pluginModel = {
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(pluginRecord())
      }),
      updateMany: vi.fn()
    };
    const repo = PluginRepo.getInstance({
      mongoClient: {
        sessionRun: vi.fn(async (fn: (session: unknown) => Promise<unknown>) =>
          fn({ id: 'session' })
        ),
        getModel: vi.fn((modelName: string) =>
          modelName === 'pluginInstallation' ? pluginInstallationModel : pluginModel
        )
      }
    } as unknown as PluginRepoDeps);

    const [result, err] = await repo.deletePluginInstallation({
      pluginId: 'plugin-a',
      source: 'team-a',
      version: '1.0.0'
    });

    expect(err).toBeNull();
    expect(result?.disabled).toBe(true);
    expect(pluginModel.updateMany).toHaveBeenCalledWith(
      {
        $or: [
          {
            pluginId: 'plugin-a',
            version: '1.0.0',
            etag: 'etag-a'
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
      { session: { id: 'session' } }
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
