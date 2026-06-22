import path from 'node:path';
import { Readable } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import { type PluginType } from '@domain/entities/plugin.entity';
import { PluginStatusEnum } from '@domain/entities/plugin-base.entity';
import { type PkgContentFileObjects } from '@domain/value-objects/file/pkg-file.vo';
import { successResult } from '@domain/value-objects/result.vo';

import { PluginRepo, type PluginRepoDeps } from './plugin.repo';

const MongoDollarKeyPrefix = '__fastgpt_mongo_dollar__';

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
  it('encodes dollar-prefixed JSON Schema keys before storing plugin records', () => {
    (PluginRepo as any)._instance = undefined;

    const repo = PluginRepo.getInstance({} as PluginRepoDeps);
    const record = (repo as any).toPluginRecord({
      ...plugin(),
      inputSchema: {
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
          [`${MongoDollarKeyPrefix}custom`]: {
            type: 'string'
          },
          query: {
            $ref: '#/$defs/keyword'
          }
        }
      },
      outputSchema: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object'
      },
      secretSchema: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object'
      },
      children: [
        {
          id: 'search',
          name: { en: 'Search', 'zh-CN': 'Search' },
          description: { en: 'Search', 'zh-CN': 'Search' },
          icon: 'https://example.com/search.svg',
          toolDescription: 'Search',
          inputSchema: {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            properties: {
              query: {
                $ref: '#/$defs/keyword'
              }
            }
          },
          outputSchema: {
            $schema: 'https://json-schema.org/draft/2020-12/schema'
          }
        }
      ]
    });

    expect(record.data.inputSchema).toMatchObject({
      [`${MongoDollarKeyPrefix}schema`]: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      [`${MongoDollarKeyPrefix}defs`]: {
        keyword: {
          type: 'string'
        }
      },
      properties: {
        schema: {
          type: 'string'
        },
        [`${MongoDollarKeyPrefix}${MongoDollarKeyPrefix}custom`]: {
          type: 'string'
        },
        query: {
          [`${MongoDollarKeyPrefix}ref`]: '#/$defs/keyword'
        }
      }
    });
    expect(record.data.inputSchema).not.toHaveProperty('$schema');
    expect(record.data.inputSchema).not.toHaveProperty('$defs');
    expect(record.data.inputSchema.properties.query).not.toHaveProperty('$ref');
    expect(record.data.outputSchema).toHaveProperty(`${MongoDollarKeyPrefix}schema`);
    expect(record.data.secretSchema).toHaveProperty(`${MongoDollarKeyPrefix}schema`);
    expect(record.data.children[0].inputSchema).toHaveProperty(`${MongoDollarKeyPrefix}schema`);
    expect(record.data.children[0].inputSchema.properties.query).toHaveProperty(
      `${MongoDollarKeyPrefix}ref`
    );
    expect(record.data.children[0].outputSchema).toHaveProperty(`${MongoDollarKeyPrefix}schema`);
  });

  it('decodes stored JSON Schema keys when reading plugin records', () => {
    (PluginRepo as any)._instance = undefined;

    const repo = PluginRepo.getInstance({} as PluginRepoDeps);
    const domainPlugin = (repo as any).toDomainPlugin({
      ...pluginRecord(),
      data: {
        ...pluginRecord().data,
        inputSchema: {
          [`${MongoDollarKeyPrefix}schema`]: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          [`${MongoDollarKeyPrefix}defs`]: {
            keyword: {
              type: 'string'
            }
          },
          properties: {
            schema: {
              type: 'string'
            },
            [`${MongoDollarKeyPrefix}${MongoDollarKeyPrefix}custom`]: {
              type: 'string'
            },
            ref: {
              type: 'string'
            },
            query: {
              [`${MongoDollarKeyPrefix}ref`]: '#/$defs/keyword'
            }
          }
        },
        outputSchema: {
          [`${MongoDollarKeyPrefix}schema`]: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object'
        },
        secretSchema: {
          [`${MongoDollarKeyPrefix}schema`]: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object'
        },
        children: [
          {
            id: 'search',
            name: { en: 'Search', 'zh-CN': 'Search' },
            description: { en: 'Search', 'zh-CN': 'Search' },
            icon: 'https://example.com/search.svg',
            toolDescription: 'Search',
            inputSchema: {
              [`${MongoDollarKeyPrefix}schema`]: 'https://json-schema.org/draft/2020-12/schema',
              type: 'object'
            },
            outputSchema: {
              [`${MongoDollarKeyPrefix}schema`]: 'https://json-schema.org/draft/2020-12/schema',
              type: 'object'
            }
          }
        ]
      }
    });

    expect(domainPlugin.inputSchema).toMatchObject({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $defs: {
        keyword: {
          type: 'string'
        }
      },
      properties: {
        schema: {
          type: 'string'
        },
        [`${MongoDollarKeyPrefix}custom`]: {
          type: 'string'
        },
        ref: {
          type: 'string'
        },
        query: {
          $ref: '#/$defs/keyword'
        }
      }
    });
    expect(domainPlugin.outputSchema).toHaveProperty('$schema');
    expect(domainPlugin.secretSchema).toHaveProperty('$schema');
    expect(domainPlugin.children?.[0].inputSchema).toHaveProperty('$schema');
    expect(domainPlugin.children?.[0].outputSchema).toHaveProperty('$schema');
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
