import { Readable } from 'node:stream';

import type { PluginType } from '@domain/entities/plugin.entity';
import type { FileObject } from '@domain/value-objects/file/file-object.vo';
import type { PkgContentFileObjects } from '@domain/value-objects/file/pkg-file.vo';
import type { I18nStringType } from '@domain/value-objects/i18n-string.vo';
import type { PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';
import type { UsecaseLogger } from '@usecase/logger.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeModelListUC } from './model/model-list.uc';
import { makeProviderListUC } from './model/providers.uc';
import { makePluginConfigGetUC } from './plugin/plugin-config-get.uc';
import { makeResetPluginConfigUC } from './plugin/plugin-config-reset.uc';
import { makeSetPluginConfigUC } from './plugin/plugin-config-set.uc';
import { makePluginConfirmUC } from './plugin/plugin-confirm.uc';
import { makePluginInstallUC, type PluginInstallUCDeps } from './plugin/plugin-install.uc';
import { makePluginListUC } from './plugin/plugin-list.uc';
import { makePluginPruneDisabledUC } from './plugin/plugin-prune-disabled.uc';
import { makePluginRegisterActiveUC } from './plugin/plugin-register-active.uc';
import {
  disableAndUnregisterReplacedPlugins,
  listReplacedActivePlugins
} from './plugin/plugin-replace-active';
import { makePluginTagListUC } from './plugin/plugin-tag-list.uc';
import { makePluginUploadUC, type PluginUploadUCDeps } from './plugin/plugin-upload.uc';
import { makePluginVersionsUC } from './plugin/plugin-versions.uc';
import { makeRuntimeMetricsUC } from './runtime/runtime-metrics.uc';
import { makeToolDetailUC } from './tool/tool-detail.uc';
import { makeToolListUC } from './tool/tool-list.uc';
import { makeToolRunUC } from './tool/tool-run.uc';

const uniqueId: PluginUniqueIdType = {
  pluginId: 'plugin-a',
  version: '1.0.0',
  etag: 'etag-a'
};

const reason = (en: string): I18nStringType => ({
  en,
  'zh-CN': en
});

const logger = (): UsecaseLogger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
});

const stream = () => Readable.from(['pkg']);

const fileObject = (fileKey: string, etag = `${fileKey}-etag`) =>
  ({
    metaData: {
      fileKey,
      fileName: `${fileKey}.pkg`,
      contentType: 'application/zip',
      size: 3,
      etag,
      createTime: new Date('2026-01-01T00:00:00Z')
    }
  }) as FileObject;

const files = () =>
  ({
    index: fileObject('index', 'index-etag'),
    manifest: fileObject('manifest', 'manifest-etag')
  }) as PkgContentFileObjects;

const plugin = (overrides: Partial<PluginType> = {}) =>
  ({
    pluginId: uniqueId.pluginId,
    version: uniqueId.version,
    etag: uniqueId.etag,
    type: 'tool',
    name: { en: 'Plugin A', 'zh-CN': 'Plugin A' },
    icon: 'https://example.com/icon.svg',
    description: { en: 'Plugin A', 'zh-CN': 'Plugin A' },
    toolDescription: 'Plugin A',
    ...overrides
  }) as PluginType;

const nonRunnablePlugin = (overrides: Record<string, unknown> = {}) =>
  plugin({
    type: 'workflow',
    ...overrides
  } as unknown as Partial<PluginType>);

const pluginPkgInfo = (info: PluginType = plugin()) => ({
  files: files(),
  info
});

const basePluginRepo = (overrides: Record<string, unknown> = {}) => ({
  getPendingPluginIds: vi.fn(),
  createPlugin: vi.fn(),
  confirmPlugin: vi.fn(),
  getPluginById: vi.fn(),
  getPluginsByPluginId: vi.fn(),
  getPluginByUserPluginId: vi.fn(),
  listVersions: vi.fn(),
  list: vi.fn(),
  listToolSummaries: vi.fn(),
  listActive: vi.fn(),
  disablePlugins: vi.fn(),
  pruneDisabled: vi.fn(),
  listTags: vi.fn(),
  getPluginFileAccessURL: vi.fn(),
  ...overrides
});

const baseRuntimeManager = (overrides: Record<string, unknown> = {}) => ({
  register: vi.fn(),
  unregister: vi.fn(),
  getConfig: vi.fn(),
  updateConfig: vi.fn(),
  resetConfig: vi.fn(),
  status: vi.fn(),
  globalStatus: vi.fn(),
  shutdown: vi.fn(),
  invoke: vi.fn(),
  ...overrides
});

describe('simple usecases', () => {
  it('delegates read and write operations to the injected ports', async () => {
    const result = successResult({ ok: true });
    const usecaseLogger = logger();
    const pluginRepo = basePluginRepo({
      list: vi.fn().mockResolvedValue(result),
      listVersions: vi.fn().mockResolvedValue(result),
      listTags: vi.fn().mockResolvedValue(result),
      pruneDisabled: vi.fn().mockResolvedValue(result)
    });
    const runtimeManager = baseRuntimeManager({
      globalStatus: vi.fn().mockResolvedValue(result),
      getConfig: vi.fn().mockResolvedValue(result),
      updateConfig: vi.fn().mockResolvedValue(result),
      resetConfig: vi.fn().mockResolvedValue(result)
    });
    const modelManager = {
      models: vi.fn().mockResolvedValue(result),
      providers: vi.fn().mockResolvedValue(result)
    };
    const toolManager = {
      list: vi.fn().mockResolvedValue(result),
      detail: vi.fn().mockResolvedValue(result),
      run: vi.fn().mockResolvedValue(result)
    };

    await expect(
      makeRuntimeMetricsUC({ pluginRuntimeManager: runtimeManager, logger: usecaseLogger })({})
    ).resolves.toBe(result);
    await expect(
      makePluginConfigGetUC({ pluginRuntimeManager: runtimeManager, logger: usecaseLogger })({
        pluginId: 'plugin-a'
      })
    ).resolves.toBe(result);
    await expect(
      makeSetPluginConfigUC({ pluginRuntimeManager: runtimeManager, logger: usecaseLogger })({
        pluginId: 'plugin-a',
        config: { mode: 'local' }
      })
    ).resolves.toBe(result);
    await expect(
      makeResetPluginConfigUC({ pluginRuntimeManager: runtimeManager, logger: usecaseLogger })({
        pluginId: 'plugin-a'
      })
    ).resolves.toBe(result);
    await expect(
      makePluginListUC({ pluginRepo, logger: usecaseLogger })({ tags: ['tools'] })
    ).resolves.toBe(result);
    await expect(
      makePluginVersionsUC({ pluginRepo, logger: usecaseLogger })({
        pluginId: 'plugin-a',
        source: 'system'
      })
    ).resolves.toBe(result);
    await expect(makePluginTagListUC({ pluginRepo, logger: usecaseLogger })({})).resolves.toBe(
      result
    );
    await expect(makePluginPruneDisabledUC({ pluginRepo, logger: usecaseLogger })()).resolves.toBe(
      result
    );
    await expect(makeModelListUC({ modelManager, logger: usecaseLogger })({})).resolves.toBe(
      result
    );
    await expect(makeProviderListUC({ modelManager, logger: usecaseLogger })({})).resolves.toBe(
      result
    );
    await expect(
      makeToolListUC({ toolManager, logger: usecaseLogger })({ tags: ['tools'] })
    ).resolves.toBe(result);
    await expect(
      makeToolDetailUC({ toolManager, logger: usecaseLogger })({
        pluginId: 'plugin-a',
        source: 'system'
      })
    ).resolves.toBe(result);
    await expect(
      makeToolRunUC({ toolManager, logger: usecaseLogger })({
        pluginId: 'plugin-a',
        input: {},
        systemVar: {
          app: { id: 'app', name: 'app' },
          chat: { chatId: 'chat' },
          invokeToken: 'invoke-token',
          time: '2026-01-01T00:00:00Z'
        }
      })
    ).resolves.toBe(result);

    expect(runtimeManager.getConfig).toHaveBeenCalledWith('plugin-a');
    expect(runtimeManager.updateConfig).toHaveBeenCalledWith('plugin-a', { mode: 'local' });
    expect(runtimeManager.resetConfig).toHaveBeenCalledWith('plugin-a');
    expect(pluginRepo.listVersions).toHaveBeenCalledWith({
      pluginId: 'plugin-a',
      source: 'system'
    });
    expect(usecaseLogger.debug).toHaveBeenCalled();
  });
});

describe('makePluginUploadUC', () => {
  const makeDeps = (overrides: Record<string, unknown> = {}) =>
    ({
      localFileStorageRepo: {
        save: vi.fn().mockResolvedValue(successResult(fileObject('upload'))),
        delete: vi.fn().mockResolvedValue(successResult(true))
      },
      pluginPKGFileResolver: {
        parsePluginPkg: vi.fn().mockResolvedValue(successResult(pluginPkgInfo()))
      },
      pluginRepo: basePluginRepo({
        createPlugin: vi.fn().mockResolvedValue(successResult({}))
      }),
      logger: logger(),
      ...overrides
    }) as unknown as PluginUploadUCDeps;

  it('returns upload failure when saving the package fails', async () => {
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi.fn().mockResolvedValue(failureResult(reason('save failed'))),
        delete: vi.fn()
      }
    });

    const [, err] = await makePluginUploadUC(deps)({ file: stream() });

    expect(err?.reason.en).toBe('Failed to Upload');
    expect(deps.pluginPKGFileResolver.parsePluginPkg).not.toHaveBeenCalled();
  });

  it('deletes the temporary file when package parsing fails', async () => {
    const deps = makeDeps({
      pluginPKGFileResolver: {
        parsePluginPkg: vi.fn().mockResolvedValue(failureResult(reason('parse failed')))
      }
    });

    const [, err] = await makePluginUploadUC(deps)({ file: stream() });

    expect(err?.reason.en).toBe('Failed to parse the plugin package');
    expect(deps.localFileStorageRepo.delete).toHaveBeenCalledWith('upload');
  });

  it('returns create failure when the pending plugin cannot be saved', async () => {
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        createPlugin: vi.fn().mockResolvedValue(failureResult(reason('create failed')))
      })
    });

    const [, err] = await makePluginUploadUC(deps)({ file: stream() });

    expect(err?.reason.en).toBe('Failed to create the plugin');
  });

  it('stores the uploaded plugin as pending on success', async () => {
    const deps = makeDeps();

    const [uploaded, err] = await makePluginUploadUC(deps)({ file: stream() });

    expect(err).toBeNull();
    expect(uploaded).toEqual(plugin());
    expect(deps.pluginRepo.createPlugin).toHaveBeenCalledWith({
      files: files(),
      plugin: plugin(),
      pending: true
    });
  });
});

describe('makePluginInstallUC', () => {
  const makeDeps = (overrides: Record<string, unknown> = {}) =>
    ({
      localFileStorageRepo: {
        save: vi.fn().mockResolvedValue(successResult(fileObject('downloaded')))
      },
      urlFileFetcher: {
        getFileStream: vi.fn().mockResolvedValue(successResult(stream()))
      },
      pluginPKGFileResolver: {
        parsePluginPkg: vi.fn().mockResolvedValue(successResult(pluginPkgInfo()))
      },
      pluginRepo: basePluginRepo({
        listActive: vi.fn().mockResolvedValue(successResult([])),
        createPlugin: vi.fn().mockResolvedValue(successResult({})),
        disablePlugins: vi.fn().mockResolvedValue(successResult({}))
      }),
      pluginRuntimeManager: baseRuntimeManager({
        register: vi.fn().mockResolvedValue(successResult({})),
        unregister: vi.fn().mockResolvedValue(successResult({}))
      }),
      logger: logger(),
      ...overrides
    }) as unknown as PluginInstallUCDeps;

  it('collects download failures from fetch and local save failures', async () => {
    const deps = makeDeps({
      urlFileFetcher: {
        getFileStream: vi
          .fn()
          .mockResolvedValueOnce(failureResult(reason('fetch failed')))
          .mockResolvedValueOnce(successResult(stream()))
      },
      localFileStorageRepo: {
        save: vi.fn().mockResolvedValue(failureResult(reason('save failed')))
      }
    });

    const [result, err] = await makePluginInstallUC(deps)({
      urls: ['fetch-failed', 'save-failed'],
      batchDownloadSize: 1
    });

    expect(err).toBeNull();
    expect(result?.failed).toHaveLength(2);
    expect(result?.failed?.map((item) => item.url)).toEqual(['fetch-failed', 'save-failed']);
  });

  it('reports package parse failures for downloaded files', async () => {
    const deps = makeDeps({
      pluginPKGFileResolver: {
        parsePluginPkg: vi.fn().mockResolvedValue(failureResult(reason('parse failed')))
      }
    });

    const [result] = await makePluginInstallUC(deps)({
      urls: ['parse-failed'],
      batchDownloadSize: 1
    });

    expect(result?.failed).toEqual([
      {
        url: 'parse-failed',
        reason: reason('parse failed')
      }
    ]);
  });

  it('uses an empty URL fallback when an install failure cannot be matched to a download', async () => {
    let metadataReads = 0;
    const shiftingFile = {
      get metaData() {
        metadataReads += 1;
        return {
          fileKey: metadataReads === 1 ? 'missing-file-key' : 'changed-file-key',
          fileName: 'changed.pkg',
          contentType: 'application/zip',
          size: 3,
          etag: 'changed-etag',
          createTime: new Date('2026-01-01T00:00:00Z')
        };
      }
    } as FileObject;
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi
          .fn()
          .mockResolvedValueOnce(successResult(undefined as unknown as FileObject))
          .mockResolvedValueOnce(successResult(shiftingFile))
      },
      pluginPKGFileResolver: {
        parsePluginPkg: vi
          .fn()
          .mockResolvedValueOnce(
            successResult(pluginPkgInfo(nonRunnablePlugin({ pluginId: 'ghost' })))
          )
          .mockResolvedValueOnce(failureResult(reason('parse failed')))
      }
    });

    const [result] = await makePluginInstallUC(deps)({
      urls: ['ghost-url', 'changed-url'],
      batchDownloadSize: 1
    });

    expect(result?.failed).toEqual([
      {
        url: '',
        reason: reason('parse failed')
      }
    ]);
  });

  it('reports active plugin lookup failures', async () => {
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        listActive: vi.fn().mockResolvedValue(failureResult(reason('active failed')))
      })
    });

    const [result] = await makePluginInstallUC(deps)({
      urls: ['active-failed'],
      batchDownloadSize: 1
    });

    expect(result?.failed?.[0]?.reason.en).toBe('Failed to get active plugins');
  });

  it('reports create, register, and replace failures during installation', async () => {
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi
          .fn()
          .mockResolvedValueOnce(successResult(fileObject('create')))
          .mockResolvedValueOnce(successResult(fileObject('register')))
          .mockResolvedValueOnce(successResult(fileObject('replace')))
      },
      pluginPKGFileResolver: {
        parsePluginPkg: vi
          .fn()
          .mockResolvedValueOnce(successResult(pluginPkgInfo(plugin({ pluginId: 'create' }))))
          .mockResolvedValueOnce(successResult(pluginPkgInfo(plugin({ pluginId: 'register' }))))
          .mockResolvedValueOnce(successResult(pluginPkgInfo(plugin({ pluginId: 'replace' }))))
      },
      pluginRepo: basePluginRepo({
        listActive: vi.fn().mockResolvedValue(successResult([plugin({ etag: 'old' })])),
        createPlugin: vi
          .fn()
          .mockResolvedValueOnce(failureResult(reason('create failed')))
          .mockResolvedValueOnce(successResult({}))
          .mockResolvedValueOnce(successResult({})),
        disablePlugins: vi.fn().mockResolvedValue(failureResult(reason('disable failed')))
      }),
      pluginRuntimeManager: baseRuntimeManager({
        register: vi
          .fn()
          .mockResolvedValueOnce(failureResult(reason('register failed')))
          .mockResolvedValueOnce(successResult({}))
      })
    });

    const [result] = await makePluginInstallUC(deps)({
      urls: ['create-url', 'register-url', 'replace-url'],
      batchDownloadSize: 1
    });

    expect(result?.failed?.map((item) => item.reason.en)).toEqual([
      'create failed',
      'register failed',
      'Failed to disable replaced plugins'
    ]);
  });

  it('returns full success after installing runnable and non-runnable plugin packages', async () => {
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi
          .fn()
          .mockResolvedValueOnce(successResult(fileObject('tool')))
          .mockResolvedValueOnce(successResult(fileObject('workflow')))
      },
      pluginPKGFileResolver: {
        parsePluginPkg: vi
          .fn()
          .mockResolvedValueOnce(successResult(pluginPkgInfo(plugin())))
          .mockResolvedValueOnce(
            successResult(pluginPkgInfo(nonRunnablePlugin({ pluginId: 'flow' })))
          )
      },
      pluginRepo: basePluginRepo({
        listActive: vi
          .fn()
          .mockResolvedValue(
            successResult([
              plugin({ etag: 'old-etag' }),
              plugin({ etag: uniqueId.etag }),
              plugin({ pluginId: 'other', etag: 'old-etag' }),
              plugin({ version: '2.0.0', etag: 'old-etag' }),
              nonRunnablePlugin({ etag: 'old-flow-etag' })
            ])
          ),
        createPlugin: vi.fn().mockResolvedValue(successResult({})),
        disablePlugins: vi.fn().mockResolvedValue(successResult({}))
      })
    });

    const [result, err] = await makePluginInstallUC(deps)({
      urls: ['tool-url', 'workflow-url'],
      batchDownloadSize: 1
    });

    expect(err).toBeNull();
    expect(result).toEqual({});
    expect(deps.pluginRuntimeManager.register).toHaveBeenCalledTimes(1);
    expect(deps.pluginRepo.disablePlugins).toHaveBeenCalledTimes(1);
  });
});

describe('makePluginConfirmUC', () => {
  const makeDeps = (overrides: Record<string, unknown> = {}) => ({
    pluginRepo: basePluginRepo({
      listActive: vi.fn().mockResolvedValue(successResult([])),
      getPendingPluginIds: vi.fn().mockResolvedValue(successResult([uniqueId])),
      confirmPlugin: vi.fn().mockResolvedValue(successResult(plugin())),
      disablePlugins: vi.fn().mockResolvedValue(successResult({}))
    }),
    pluginRuntimeManager: baseRuntimeManager({
      register: vi.fn().mockResolvedValue(successResult({})),
      unregister: vi.fn().mockResolvedValue(successResult({}))
    }),
    logger: logger(),
    ...overrides
  });

  it('returns failure when replaced active plugins cannot be listed', async () => {
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        listActive: vi.fn().mockResolvedValue(failureResult(reason('active failed')))
      })
    });

    const [, err] = await makePluginConfirmUC(deps)({ uniqueIds: [uniqueId] });

    expect(err?.reason.en).toBe('Failed to get active plugins');
  });

  it('returns failure when pending plugins cannot be listed', async () => {
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        listActive: vi.fn().mockResolvedValue(successResult([])),
        getPendingPluginIds: vi.fn().mockResolvedValue(failureResult(reason('pending failed')))
      })
    });

    const [, err] = await makePluginConfirmUC(deps)({ uniqueIds: [uniqueId] });

    expect(err?.reason.en).toBe('Failed to get pending plugins');
  });

  it('returns failure when the target plugin is not pending', async () => {
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        listActive: vi.fn().mockResolvedValue(successResult([])),
        getPendingPluginIds: vi.fn().mockResolvedValue(
          successResult([
            {
              pluginId: 'other',
              version: uniqueId.version,
              etag: uniqueId.etag
            }
          ])
        )
      })
    });

    const [, err] = await makePluginConfirmUC(deps)({ uniqueIds: [uniqueId] });

    expect(err?.reason.en).toBe('Pending Plugin not found');
  });

  it('returns failure when confirming the pending plugin fails', async () => {
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        listActive: vi.fn().mockResolvedValue(successResult([])),
        getPendingPluginIds: vi.fn().mockResolvedValue(
          successResult([
            {
              pluginId: 'other',
              version: uniqueId.version,
              etag: uniqueId.etag
            },
            uniqueId
          ])
        ),
        confirmPlugin: vi.fn().mockResolvedValue(failureResult(reason('confirm failed')))
      })
    });

    const [, err] = await makePluginConfirmUC(deps)({ uniqueIds: [uniqueId] });

    expect(err?.reason.en).toBe('Failed to confirm plugin');
  });

  it('returns failure when runtime registration fails', async () => {
    const deps = makeDeps({
      pluginRuntimeManager: baseRuntimeManager({
        register: vi.fn().mockResolvedValue(failureResult(reason('register failed')))
      })
    });

    const [, err] = await makePluginConfirmUC(deps)({ uniqueIds: [uniqueId] });

    expect(err?.reason.en).toBe('Failed to register confirmed plugin');
  });

  it('returns failure when replaced plugins cannot be disabled', async () => {
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        listActive: vi.fn().mockResolvedValue(successResult([plugin({ etag: 'old' })])),
        getPendingPluginIds: vi.fn().mockResolvedValue(successResult([uniqueId])),
        confirmPlugin: vi.fn().mockResolvedValue(successResult(plugin())),
        disablePlugins: vi.fn().mockResolvedValue(failureResult(reason('disable failed')))
      })
    });

    const [, err] = await makePluginConfirmUC(deps)({ uniqueIds: [uniqueId] });

    expect(err?.reason.en).toBe('Failed to disable replaced plugins');
  });

  it('confirms every runnable pending plugin successfully', async () => {
    const secondId = {
      pluginId: 'plugin-b',
      version: '1.0.0',
      etag: 'etag-b'
    };
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        listActive: vi.fn().mockResolvedValue(successResult([plugin({ etag: 'old' })])),
        getPendingPluginIds: vi.fn().mockResolvedValue(successResult([uniqueId, secondId])),
        confirmPlugin: vi
          .fn()
          .mockResolvedValueOnce(successResult(plugin()))
          .mockResolvedValueOnce(successResult(plugin(secondId))),
        disablePlugins: vi.fn().mockResolvedValue(successResult({}))
      })
    });

    const [result, err] = await makePluginConfirmUC(deps)({ uniqueIds: [uniqueId, secondId] });

    expect(err).toBeNull();
    expect(result).toEqual({});
    expect(deps.pluginRepo.confirmPlugin).toHaveBeenCalledTimes(2);
  });

  it('returns unsupported failure for non-runnable plugins', async () => {
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        listActive: vi.fn().mockResolvedValue(successResult([])),
        getPendingPluginIds: vi.fn().mockResolvedValue(successResult([uniqueId])),
        confirmPlugin: vi.fn().mockResolvedValue(successResult(nonRunnablePlugin()))
      })
    });

    const [, err] = await makePluginConfirmUC(deps)({ uniqueIds: [uniqueId] });

    expect(err?.reason.en).toBe('Plugin type is not supported');
  });
});

describe('makePluginRegisterActiveUC', () => {
  it('returns failure when active plugins cannot be listed', async () => {
    const deps = {
      pluginRepo: basePluginRepo({
        listActive: vi.fn().mockResolvedValue(failureResult(reason('active failed')))
      }),
      pluginRuntimeManager: baseRuntimeManager(),
      logger: logger()
    };

    const [, err] = await makePluginRegisterActiveUC(deps)();

    expect(err?.reason.en).toBe('Failed to get active plugins');
  });

  it('registers only runnable active plugins', async () => {
    const deps = {
      pluginRepo: basePluginRepo({
        listActive: vi.fn().mockResolvedValue(successResult([nonRunnablePlugin(), plugin()]))
      }),
      pluginRuntimeManager: baseRuntimeManager({
        register: vi.fn().mockResolvedValue(successResult({}))
      }),
      logger: logger()
    };

    const [result, err] = await makePluginRegisterActiveUC(deps)();

    expect(err).toBeNull();
    expect(result).toBe('ok');
    expect(deps.pluginRuntimeManager.register).toHaveBeenCalledTimes(1);
    expect(deps.pluginRuntimeManager.register).toHaveBeenCalledWith(uniqueId);
  });

  it('returns failure when registering an active plugin fails', async () => {
    const deps = {
      pluginRepo: basePluginRepo({
        listActive: vi.fn().mockResolvedValue(successResult([plugin()]))
      }),
      pluginRuntimeManager: baseRuntimeManager({
        register: vi.fn().mockResolvedValue(failureResult(reason('register failed')))
      }),
      logger: logger()
    };

    const [, err] = await makePluginRegisterActiveUC(deps)();

    expect(err?.reason.en).toBe('Failed to register active plugin');
  });
});

describe('plugin replacement helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('filters active plugins that match plugin id and version but use another etag', async () => {
    const repo = basePluginRepo({
      listActive: vi
        .fn()
        .mockResolvedValue(
          successResult([
            plugin({ etag: 'old' }),
            plugin(),
            plugin({ pluginId: 'other', etag: 'old' }),
            plugin({ version: '2.0.0', etag: 'old' })
          ])
        )
    });

    const [replaced, err] = await listReplacedActivePlugins(repo, uniqueId);

    expect(err).toBeNull();
    expect(replaced).toEqual([plugin({ etag: 'old' })]);
  });

  it('returns failure when active plugin listing fails', async () => {
    const repo = basePluginRepo({
      listActive: vi.fn().mockResolvedValue(failureResult(reason('active failed')))
    });

    const [, err] = await listReplacedActivePlugins(repo, uniqueId);

    expect(err?.reason.en).toBe('Failed to get active plugins');
  });

  it('returns failure when replaced plugins cannot be disabled', async () => {
    const deps = {
      pluginRepo: basePluginRepo({
        disablePlugins: vi.fn().mockResolvedValue(failureResult(reason('disable failed')))
      }),
      pluginRuntimeManager: baseRuntimeManager(),
      replacedPlugins: [plugin({ etag: 'old' })]
    };

    const [, err] = await disableAndUnregisterReplacedPlugins(deps);

    expect(err?.reason.en).toBe('Failed to disable replaced plugins');
  });

  it('logs unregister failures and still completes replacement cleanup', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const deps = {
      pluginRepo: basePluginRepo({
        disablePlugins: vi.fn().mockResolvedValue(successResult({}))
      }),
      pluginRuntimeManager: baseRuntimeManager({
        unregister: vi
          .fn()
          .mockResolvedValueOnce(failureResult(reason('unregister failed')))
          .mockRejectedValueOnce(new Error('boom'))
          .mockResolvedValueOnce(successResult({}))
      }),
      replacedPlugins: [
        plugin({ etag: 'old-a' }),
        plugin({ etag: 'old-b' }),
        plugin({ etag: 'old-c' }),
        nonRunnablePlugin({ etag: 'old-flow' })
      ]
    };

    const [result, err] = await disableAndUnregisterReplacedPlugins(deps);

    expect(err).toBeNull();
    expect(result).toEqual({});
    expect(deps.pluginRuntimeManager.unregister).toHaveBeenCalledTimes(3);
    expect(consoleError).toHaveBeenCalledTimes(2);
  });
});
