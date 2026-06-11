import { Readable } from 'node:stream';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PluginType } from '@domain/entities/plugin.entity';
import type { FileObject } from '@domain/value-objects/file/file-object.vo';
import type { PkgContentFileObjects } from '@domain/value-objects/file/pkg-file.vo';
import type { I18nStringType } from '@domain/value-objects/i18n-string.vo';
import type { PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import { failureResult, successResult } from '@domain/value-objects/result.vo';
import type { UsecaseLogger } from '@usecase/logger.port';

import { makeModelListUC } from './model/model-list.uc';
import { makeProviderListUC } from './model/providers.uc';
import { makePluginConfigGetUC } from './plugin/plugin-config-get.uc';
import { makeResetPluginConfigUC } from './plugin/plugin-config-reset.uc';
import { makeSetPluginConfigUC } from './plugin/plugin-config-set.uc';
import { makePluginConfirmUC } from './plugin/plugin-confirm.uc';
import { makePluginDeleteUC } from './plugin/plugin-delete.uc';
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

const namedFileObject = (fileKey: string, fileName: string, etag = `${fileKey}-etag`) =>
  ({
    metaData: {
      fileKey,
      fileName,
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
  deletePendingPlugin: vi.fn().mockResolvedValue(successResult({})),
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

const baseModelManager = (overrides: Record<string, unknown> = {}) => ({
  models: vi.fn(),
  providers: vi.fn(),
  ...overrides
});

const baseToolManager = (overrides: Record<string, unknown> = {}) => ({
  list: vi.fn(),
  detail: vi.fn(),
  run: vi.fn(),
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
    const toolManager = baseToolManager({
      list: vi.fn().mockResolvedValue(result),
      detail: vi.fn().mockResolvedValue(result),
      run: vi.fn().mockResolvedValue(result)
    });

    await expect(
      makeRuntimeMetricsUC({ pluginRuntimeManager: runtimeManager, logger: usecaseLogger })({})
    ).resolves.toEqual(result);
    await expect(
      makePluginConfigGetUC({ pluginRuntimeManager: runtimeManager, logger: usecaseLogger })({
        pluginId: 'plugin-a'
      })
    ).resolves.toEqual(result);
    await expect(
      makeSetPluginConfigUC({ pluginRuntimeManager: runtimeManager, logger: usecaseLogger })({
        pluginId: 'plugin-a',
        config: { mode: 'local' }
      })
    ).resolves.toEqual(result);
    await expect(
      makeResetPluginConfigUC({ pluginRuntimeManager: runtimeManager, logger: usecaseLogger })({
        pluginId: 'plugin-a'
      })
    ).resolves.toEqual(result);
    await expect(
      makePluginListUC({ pluginRepo, logger: usecaseLogger })({ tags: ['tools'] })
    ).resolves.toEqual(result);
    await expect(
      makePluginVersionsUC({ pluginRepo, logger: usecaseLogger })({
        pluginId: 'plugin-a',
        source: 'system'
      })
    ).resolves.toEqual(result);
    await expect(makePluginTagListUC({ pluginRepo, logger: usecaseLogger })({})).resolves.toEqual(
      result
    );
    await expect(
      makePluginPruneDisabledUC({ pluginRepo, logger: usecaseLogger })()
    ).resolves.toEqual(result);
    await expect(makeModelListUC({ modelManager, logger: usecaseLogger })({})).resolves.toEqual(
      result
    );
    await expect(makeProviderListUC({ modelManager, logger: usecaseLogger })({})).resolves.toEqual(
      result
    );
    await expect(
      makeToolListUC({ toolManager, logger: usecaseLogger })({ tags: ['tools'] })
    ).resolves.toEqual(result);
    await expect(
      makeToolDetailUC({ toolManager, logger: usecaseLogger })({
        pluginId: 'plugin-a',
        source: 'system'
      })
    ).resolves.toEqual(result);
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
    ).resolves.toEqual(result);

    expect(runtimeManager.getConfig).toHaveBeenCalledWith('plugin-a');
    expect(runtimeManager.updateConfig).toHaveBeenCalledWith('plugin-a', { mode: 'local' });
    expect(runtimeManager.resetConfig).toHaveBeenCalledWith('plugin-a');
    expect(pluginRepo.listVersions).toHaveBeenCalledWith({
      pluginId: 'plugin-a',
      source: 'system'
    });
    expect(usecaseLogger.debug).toHaveBeenCalled();
  });

  it('records usecase error logs before returning port failures', async () => {
    const result = failureResult(reason('list failed'));
    const usecaseLogger = logger();
    const toolManager = baseToolManager({
      list: vi.fn().mockResolvedValue(result)
    });

    await expect(
      makeToolListUC({ toolManager, logger: usecaseLogger })({ tags: ['tools'] })
    ).resolves.toEqual(result);

    expect(usecaseLogger.error).toHaveBeenCalledWith(
      'Tool List Error',
      expect.objectContaining({
        input: { tags: ['tools'] },
        reason: result[1]?.reason,
        message: 'list failed',
        error: expect.objectContaining({
          name: 'Error',
          message: 'list failed'
        })
      })
    );
  });

  it.each([
    {
      name: 'runtime metrics',
      message: 'Runtime Metrics Error',
      expectedErrorContext: {},
      run: (result: ReturnType<typeof failureResult>, usecaseLogger: UsecaseLogger) =>
        makeRuntimeMetricsUC({
          pluginRuntimeManager: baseRuntimeManager({
            globalStatus: vi.fn().mockResolvedValue(result)
          }),
          logger: usecaseLogger
        })({})
    },
    {
      name: 'plugin config get',
      message: 'Plugin Config Get Error',
      expectedErrorContext: { pluginId: 'plugin-a' },
      run: (result: ReturnType<typeof failureResult>, usecaseLogger: UsecaseLogger) =>
        makePluginConfigGetUC({
          pluginRuntimeManager: baseRuntimeManager({
            getConfig: vi.fn().mockResolvedValue(result)
          }),
          logger: usecaseLogger
        })({ pluginId: 'plugin-a' })
    },
    {
      name: 'plugin config set',
      message: 'Plugin Config Set Error',
      expectedErrorContext: { input: { pluginId: 'plugin-a', config: { mode: 'local' } } },
      run: (result: ReturnType<typeof failureResult>, usecaseLogger: UsecaseLogger) =>
        makeSetPluginConfigUC({
          pluginRuntimeManager: baseRuntimeManager({
            updateConfig: vi.fn().mockResolvedValue(result)
          }),
          logger: usecaseLogger
        })({ pluginId: 'plugin-a', config: { mode: 'local' } })
    },
    {
      name: 'plugin config reset',
      message: 'Plugin Config Reset Error',
      expectedErrorContext: { pluginId: 'plugin-a' },
      run: (result: ReturnType<typeof failureResult>, usecaseLogger: UsecaseLogger) =>
        makeResetPluginConfigUC({
          pluginRuntimeManager: baseRuntimeManager({
            resetConfig: vi.fn().mockResolvedValue(result)
          }),
          logger: usecaseLogger
        })({ pluginId: 'plugin-a' })
    },
    {
      name: 'plugin list',
      message: 'Plugin List Error',
      expectedErrorContext: { input: { tags: ['tools'] } },
      run: (result: ReturnType<typeof failureResult>, usecaseLogger: UsecaseLogger) =>
        makePluginListUC({
          pluginRepo: basePluginRepo({
            list: vi.fn().mockResolvedValue(result)
          }),
          logger: usecaseLogger
        })({ tags: ['tools'] })
    },
    {
      name: 'plugin versions',
      message: 'Plugin Versions Error',
      expectedErrorContext: { input: { pluginId: 'plugin-a', source: 'system' } },
      run: (result: ReturnType<typeof failureResult>, usecaseLogger: UsecaseLogger) =>
        makePluginVersionsUC({
          pluginRepo: basePluginRepo({
            listVersions: vi.fn().mockResolvedValue(result)
          }),
          logger: usecaseLogger
        })({ pluginId: 'plugin-a', source: 'system' })
    },
    {
      name: 'plugin tag list',
      message: 'Plugin Tag List Error',
      expectedErrorContext: {},
      run: (result: ReturnType<typeof failureResult>, usecaseLogger: UsecaseLogger) =>
        makePluginTagListUC({
          pluginRepo: basePluginRepo({
            listTags: vi.fn().mockResolvedValue(result)
          }),
          logger: usecaseLogger
        })({})
    },
    {
      name: 'plugin prune disabled',
      message: 'Plugin Prune Disabled Error',
      expectedErrorContext: {},
      run: (result: ReturnType<typeof failureResult>, usecaseLogger: UsecaseLogger) =>
        makePluginPruneDisabledUC({
          pluginRepo: basePluginRepo({
            pruneDisabled: vi.fn().mockResolvedValue(result)
          }),
          logger: usecaseLogger
        })()
    },
    {
      name: 'model list',
      message: 'Model List Error',
      expectedErrorContext: {},
      run: (result: ReturnType<typeof failureResult>, usecaseLogger: UsecaseLogger) =>
        makeModelListUC({
          modelManager: baseModelManager({
            models: vi.fn().mockResolvedValue(result)
          }),
          logger: usecaseLogger
        })({})
    },
    {
      name: 'provider list',
      message: 'Provider List Error',
      expectedErrorContext: { input: {} },
      run: (result: ReturnType<typeof failureResult>, usecaseLogger: UsecaseLogger) =>
        makeProviderListUC({
          modelManager: baseModelManager({
            providers: vi.fn().mockResolvedValue(result)
          }),
          logger: usecaseLogger
        })({})
    },
    {
      name: 'tool detail',
      message: 'Tool Detail Error',
      expectedErrorContext: { input: { pluginId: 'plugin-a', source: 'system' } },
      run: (result: ReturnType<typeof failureResult>, usecaseLogger: UsecaseLogger) =>
        makeToolDetailUC({
          toolManager: baseToolManager({
            detail: vi.fn().mockResolvedValue(result)
          }),
          logger: usecaseLogger
        })({ pluginId: 'plugin-a', source: 'system' })
    },
    {
      name: 'tool run',
      message: 'Tool Run Error',
      expectedErrorContext: {
        input: {
          pluginId: 'plugin-a',
          source: 'system',
          input: {},
          hasSecrets: false,
          systemVar: {
            app: { id: 'app', name: 'app' },
            chat: { chatId: 'chat' },
            time: '2026-01-01T00:00:00Z'
          }
        }
      },
      run: (result: ReturnType<typeof failureResult>, usecaseLogger: UsecaseLogger) =>
        makeToolRunUC({
          toolManager: baseToolManager({
            run: vi.fn().mockResolvedValue(result)
          }),
          logger: usecaseLogger
        })({
          pluginId: 'plugin-a',
          input: {},
          systemVar: {
            app: { id: 'app', name: 'app' },
            chat: { chatId: 'chat' },
            invokeToken: 'invoke-token',
            time: '2026-01-01T00:00:00Z'
          }
        })
    }
  ])(
    'records usecase error logs for $name failures',
    async ({ message, run, expectedErrorContext }) => {
    const result = failureResult(reason(`${message} failed`));
    const usecaseLogger = logger();

    await expect(run(result, usecaseLogger)).resolves.toEqual(result);

      expect(usecaseLogger.error).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          ...expectedErrorContext,
          reason: reason(`${message} failed`),
          message: `${message} failed`,
          error: expect.objectContaining({
            name: 'Error',
            message: `${message} failed`
          })
        })
      );
    }
  );

  it('records tool detail input and nested error cause details', async () => {
    const cause = new Error('database timeout while reading getTime');
    const result = failureResult(reason('Failed to get tool detail'), cause);
    const usecaseLogger = logger();

    await expect(
      makeToolDetailUC({
        toolManager: baseToolManager({
          detail: vi.fn().mockResolvedValue(result)
        }),
        logger: usecaseLogger
      })({
        pluginId: 'getTime',
        source: 'system',
        version: '9.9.9',
        fallbackLatestVersion: true
      })
    ).resolves.toEqual(result);

    expect(usecaseLogger.error).toHaveBeenCalledWith(
      'Tool Detail Error',
      expect.objectContaining({
        input: {
          pluginId: 'getTime',
          source: 'system',
          version: '9.9.9',
          fallbackLatestVersion: true
        },
        reason: reason('Failed to get tool detail'),
        error: expect.objectContaining({
          message: 'Failed to get tool detail',
          cause: expect.objectContaining({
            message: 'database timeout while reading getTime'
          })
        })
      })
    );
  });

  it('records tool run error code and diagnostic context without secret fields', async () => {
    const result = failureResult({
      reason: reason('Plugin invocation timed out'),
      error: new Error('Plugin invocation timed out'),
      code: 'plugin.invoke.timeout',
      message: 'Plugin invocation timed out',
      data: {
        pluginId: 'plugin-a',
        version: '1.0.0',
        input: { timezone: 'Asia/Shanghai' }
      }
    });
    const usecaseLogger = logger();

    await expect(
      makeToolRunUC({
        toolManager: baseToolManager({
          run: vi.fn().mockResolvedValue(result)
        }),
        logger: usecaseLogger
      })({
        pluginId: 'plugin-a',
        version: '1.0.0',
        input: { timezone: 'Asia/Shanghai' },
        secrets: { apiKey: 'secret-key' },
        systemVar: {
          app: { id: 'app', name: 'app' },
          chat: { chatId: 'chat', uid: 'user' },
          invokeToken: 'invoke-token',
          time: '2026-01-01T00:00:00Z'
        }
      })
    ).resolves.toEqual(result);

    expect(usecaseLogger.error).toHaveBeenCalledWith(
      'Tool Run Error',
      expect.objectContaining({
        reason: result[1]?.reason,
        code: 'plugin.invoke.timeout',
        message: 'Plugin invocation timed out',
        data: {
          pluginId: 'plugin-a',
          version: '1.0.0',
          input: { timezone: 'Asia/Shanghai' }
        },
        error: expect.objectContaining({
          name: 'Error',
          message: 'Plugin invocation timed out'
        }),
        input: {
        pluginId: 'plugin-a',
        source: 'system',
        version: '1.0.0',
        input: { timezone: 'Asia/Shanghai' },
        hasSecrets: true,
        systemVar: {
          app: { id: 'app', name: 'app' },
          chat: { chatId: 'chat', uid: 'user' },
          time: '2026-01-01T00:00:00Z'
        }
      }
      })
    );
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
        parsePluginZipFiles: vi.fn(),
        parsePluginPkg: vi.fn().mockResolvedValue(successResult(pluginPkgInfo()))
      },
      pluginRepo: basePluginRepo({
        getPendingPluginIds: vi.fn().mockResolvedValue(successResult([])),
        createPlugin: vi.fn().mockResolvedValue(successResult({}))
      }),
      logger: logger(),
      ...overrides
    }) as unknown as PluginUploadUCDeps;

  it('records save failures and continues uploading the rest of the batch', async () => {
    const successfulFile = fileObject('second');
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi
          .fn()
          .mockResolvedValueOnce(failureResult(reason('save failed')))
          .mockResolvedValueOnce(successResult(successfulFile)),
        delete: vi.fn().mockResolvedValue(successResult(true))
      }
    });

    const [uploaded, err] = await makePluginUploadUC(deps)({
      files: [
        { file: stream(), fileName: 'bad.pkg' },
        { file: stream(), fileName: 'second.pkg' }
      ]
    });

    expect(err).toBeNull();
    expect(uploaded).toEqual({
      plugins: [plugin()],
      failed: [
        {
          fileName: 'bad.pkg',
          reason: reason('save failed')
        }
      ]
    });
    expect(deps.pluginPKGFileResolver.parsePluginPkg).toHaveBeenCalledWith(successfulFile, true);
  });

  it('requires at least one uploaded package', async () => {
    const deps = makeDeps();

    const [, err] = await makePluginUploadUC(deps)({ files: [] });

    expect(err?.reason.en).toBe('file is required');
    expect(deps.localFileStorageRepo.save).not.toHaveBeenCalled();
  });

  it('records extraction failures and continues uploading the rest of the batch', async () => {
    const bundleFile = namedFileObject('bundle', 'bundle.zip');
    const pkgFile = fileObject('second');
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi
          .fn()
          .mockResolvedValueOnce(successResult(bundleFile))
          .mockResolvedValueOnce(successResult(pkgFile)),
        delete: vi.fn().mockResolvedValue(successResult(true))
      },
      pluginPKGFileResolver: {
        parsePluginZipFiles: vi.fn().mockResolvedValue(failureResult(reason('extract failed'))),
        parsePluginPkg: vi.fn().mockResolvedValue(successResult(pluginPkgInfo()))
      }
    });

    const [uploaded, err] = await makePluginUploadUC(deps)({
      files: [
        { file: stream(), fileName: 'bundle.zip' },
        { file: stream(), fileName: 'second.pkg' }
      ]
    });

    expect(err).toBeNull();
    expect(uploaded).toEqual({
      plugins: [plugin()],
      failed: [
        {
          fileName: 'bundle.zip',
          reason: reason('extract failed')
        }
      ]
    });
    expect(deps.localFileStorageRepo.delete).toHaveBeenCalledWith('bundle');
    expect(deps.pluginPKGFileResolver.parsePluginPkg).toHaveBeenCalledWith(pkgFile, true);
  });

  it('records parsing failures and keeps uploading other packages', async () => {
    const badFile = fileObject('bad');
    const goodFile = fileObject('good');
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi
          .fn()
          .mockResolvedValueOnce(successResult(badFile))
          .mockResolvedValueOnce(successResult(goodFile)),
        delete: vi.fn().mockResolvedValue(successResult(true))
      },
      pluginPKGFileResolver: {
        parsePluginZipFiles: vi.fn(),
        parsePluginPkg: vi
          .fn()
          .mockResolvedValueOnce(failureResult(reason('parse failed')))
          .mockResolvedValueOnce(successResult(pluginPkgInfo(plugin({ pluginId: 'good' }))))
      }
    });

    const [uploaded, err] = await makePluginUploadUC(deps)({
      files: [
        { file: stream(), fileName: 'bad.pkg' },
        { file: stream(), fileName: 'good.pkg' }
      ]
    });

    expect(err).toBeNull();
    expect(uploaded).toEqual({
      plugins: [plugin({ pluginId: 'good' })],
      failed: [
        {
          fileName: 'bad.pkg',
          reason: reason('parse failed')
        }
      ]
    });
    expect(deps.localFileStorageRepo.delete).toHaveBeenCalledWith('bad');
  });

  it('records unsupported package failures without blocking supported packages', async () => {
    const unsupportedFile = namedFileObject('upload', 'plugin.txt');
    const supportedFile = fileObject('good');
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi
          .fn()
          .mockResolvedValueOnce(successResult(unsupportedFile))
          .mockResolvedValueOnce(successResult(supportedFile)),
        delete: vi.fn().mockResolvedValue(successResult(true))
      },
      pluginPKGFileResolver: {
        parsePluginZipFiles: vi.fn(),
        parsePluginPkg: vi.fn().mockResolvedValue(successResult(pluginPkgInfo()))
      }
    });

    const [uploaded, err] = await makePluginUploadUC(deps)({
      files: [
        { file: stream(), fileName: 'plugin.txt' },
        { file: stream(), fileName: 'good.pkg' }
      ]
    });

    expect(err).toBeNull();
    expect(uploaded).toEqual({
      plugins: [plugin()],
      failed: [
        {
          fileName: 'plugin.txt',
          reason: {
            en: 'Only .pkg and .zip plugin packages are supported',
            'zh-CN': '仅支持 .pkg 和 .zip 插件包'
          }
        }
      ]
    });
    expect(deps.localFileStorageRepo.delete).toHaveBeenCalledWith('upload');
    expect(deps.pluginPKGFileResolver.parsePluginZipFiles).not.toHaveBeenCalled();
    expect(deps.pluginPKGFileResolver.parsePluginPkg).toHaveBeenCalledWith(supportedFile, true);
  });

  it('records create failures instead of failing the whole upload request', async () => {
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        getPendingPluginIds: vi.fn().mockResolvedValue(successResult([])),
        createPlugin: vi.fn().mockResolvedValue(failureResult(reason('create failed')))
      })
    });

    const [uploaded, err] = await makePluginUploadUC(deps)({
      files: [{ file: stream(), fileName: 'plugin.pkg' }]
    });

    expect(err).toBeNull();
    expect(uploaded).toEqual({
      plugins: [],
      failed: [
        {
          fileName: 'upload.pkg',
          reason: reason('create failed')
        }
      ]
    });
  });

  it('returns failure when existing pending plugins cannot be listed before create', async () => {
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        getPendingPluginIds: vi.fn().mockResolvedValue(failureResult(reason('pending failed'))),
        createPlugin: vi.fn().mockResolvedValue(successResult({}))
      })
    });

    const [, err] = await makePluginUploadUC(deps)({
      files: [{ file: stream(), fileName: 'plugin.pkg' }]
    });

    expect(err?.reason.en).toBe('Failed to get pending plugin ids');
    expect(deps.pluginRepo.createPlugin).not.toHaveBeenCalled();
  });

  it('stores the uploaded plugin as pending on success', async () => {
    const deps = makeDeps();

    const [uploaded, err] = await makePluginUploadUC(deps)({
      files: [{ file: stream(), fileName: 'plugin.pkg' }]
    });

    expect(err).toBeNull();
    expect(uploaded).toEqual({ plugins: [plugin()] });
    expect(deps.localFileStorageRepo.save).toHaveBeenCalledWith({
      file: expect.any(Readable),
      fileKey: expect.any(String),
      fileName: 'plugin.pkg',
      contentType: 'application/zip',
      overwrite: true
    });
    expect(deps.pluginRepo.createPlugin).toHaveBeenCalledWith({
      files: files(),
      plugin: plugin(),
      pending: true
    });
  });

  it('keeps pending plugins created before a later package parse failure', async () => {
    const firstFile = fileObject('first');
    const secondFile = fileObject('second');
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi
          .fn()
          .mockResolvedValueOnce(successResult(firstFile))
          .mockResolvedValueOnce(successResult(secondFile)),
        delete: vi.fn().mockResolvedValue(successResult(true))
      },
      pluginPKGFileResolver: {
        parsePluginZipFiles: vi.fn(),
        parsePluginPkg: vi
          .fn()
          .mockResolvedValueOnce(successResult(pluginPkgInfo(plugin({ pluginId: 'first' }))))
          .mockResolvedValueOnce(failureResult(reason('parse failed')))
      }
    });

    const [uploaded, err] = await makePluginUploadUC(deps)({
      files: [
        { file: stream(), fileName: 'first.pkg' },
        { file: stream(), fileName: 'second.pkg' }
      ]
    });

    expect(err).toBeNull();
    expect(uploaded).toEqual({
      plugins: [plugin({ pluginId: 'first' })],
      failed: [
        {
          fileName: 'second.pkg',
          reason: reason('parse failed')
        }
      ]
    });
    expect(deps.pluginRepo.createPlugin).toHaveBeenCalledTimes(1);
    expect(deps.pluginRepo.deletePendingPlugin).not.toHaveBeenCalled();
    expect(deps.localFileStorageRepo.delete).toHaveBeenCalledWith('second');
  });

  it('rolls back only the current pending plugin when its create fails after partial writes', async () => {
    const firstPlugin = plugin({ pluginId: 'first', etag: 'first-etag' });
    const secondPlugin = plugin({ pluginId: 'second', etag: 'second-etag' });
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi
          .fn()
          .mockResolvedValueOnce(successResult(fileObject('first')))
          .mockResolvedValueOnce(successResult(fileObject('second'))),
        delete: vi.fn().mockResolvedValue(successResult(true))
      },
      pluginPKGFileResolver: {
        parsePluginZipFiles: vi.fn(),
        parsePluginPkg: vi
          .fn()
          .mockResolvedValueOnce(successResult(pluginPkgInfo(firstPlugin)))
          .mockResolvedValueOnce(successResult(pluginPkgInfo(secondPlugin)))
      },
      pluginRepo: basePluginRepo({
        getPendingPluginIds: vi.fn().mockResolvedValue(successResult([])),
        createPlugin: vi
          .fn()
          .mockResolvedValueOnce(successResult({}))
          .mockResolvedValueOnce(failureResult(reason('create failed'))),
        deletePendingPlugin: vi.fn().mockResolvedValue(successResult({}))
      })
    });

    const [uploaded, err] = await makePluginUploadUC(deps)({
      files: [
        { file: stream(), fileName: 'first.pkg' },
        { file: stream(), fileName: 'second.pkg' }
      ]
    });

    expect(err).toBeNull();
    expect(uploaded).toEqual({
      plugins: [firstPlugin],
      failed: [
        {
          fileName: 'second.pkg',
          reason: reason('create failed')
        }
      ]
    });
    expect(deps.pluginRepo.deletePendingPlugin).toHaveBeenCalledTimes(1);
    expect(deps.pluginRepo.deletePendingPlugin).toHaveBeenCalledWith({
      pluginId: 'second',
      version: '1.0.0',
      etag: 'second-etag'
    });
  });

  it('logs rollback failures without masking the create failure', async () => {
    const appLogger = logger();
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        getPendingPluginIds: vi.fn().mockResolvedValue(successResult([])),
        createPlugin: vi.fn().mockResolvedValue(failureResult(reason('create failed'))),
        deletePendingPlugin: vi.fn().mockResolvedValue(failureResult(reason('rollback failed')))
      }),
      logger: appLogger
    });

    const [uploaded, err] = await makePluginUploadUC(deps)({
      files: [{ file: stream(), fileName: 'plugin.pkg' }]
    });

    expect(err).toBeNull();
    expect(uploaded?.failed?.[0]?.reason.en).toBe('create failed');
    expect(appLogger.warn).toHaveBeenCalledWith(
      'Failed to rollback pending plugin',
      expect.objectContaining({
        uniqueId,
        error: expect.objectContaining({
          reason: reason('rollback failed'),
          message: 'rollback failed',
          error: expect.objectContaining({
            message: 'rollback failed'
          })
        })
      })
    );
  });

  it('does not delete pending plugins that existed before the upload batch', async () => {
    const firstPlugin = plugin({ pluginId: 'first', etag: 'first-etag' });
    const secondPlugin = plugin({ pluginId: 'second', etag: 'second-etag' });
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi
          .fn()
          .mockResolvedValueOnce(successResult(fileObject('first')))
          .mockResolvedValueOnce(successResult(fileObject('second'))),
        delete: vi.fn().mockResolvedValue(successResult(true))
      },
      pluginPKGFileResolver: {
        parsePluginZipFiles: vi.fn(),
        parsePluginPkg: vi
          .fn()
          .mockResolvedValueOnce(successResult(pluginPkgInfo(firstPlugin)))
          .mockResolvedValueOnce(successResult(pluginPkgInfo(secondPlugin)))
      },
      pluginRepo: basePluginRepo({
        getPendingPluginIds: vi.fn().mockResolvedValue(successResult([firstPlugin])),
        createPlugin: vi.fn().mockResolvedValue(failureResult(reason('create failed'))),
        deletePendingPlugin: vi.fn().mockResolvedValue(successResult({}))
      })
    });

    const [uploaded, err] = await makePluginUploadUC(deps)({
      files: [
        { file: stream(), fileName: 'first.pkg' },
        { file: stream(), fileName: 'second.pkg' }
      ]
    });

    expect(err).toBeNull();
    expect(uploaded).toEqual({
      plugins: [],
      failed: [
        {
          fileName: 'first.pkg',
          reason: reason('create failed')
        },
        {
          fileName: 'second.pkg',
          reason: reason('create failed')
        }
      ]
    });
    expect(deps.pluginRepo.deletePendingPlugin).toHaveBeenCalledTimes(1);
    expect(deps.pluginRepo.deletePendingPlugin).toHaveBeenCalledWith({
      pluginId: 'second',
      version: '1.0.0',
      etag: 'second-etag'
    });
  });

  it('stores every uploaded package in a batch as pending', async () => {
    const firstFile = fileObject('first');
    const secondFile = fileObject('second');
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi
          .fn()
          .mockResolvedValueOnce(successResult(firstFile))
          .mockResolvedValueOnce(successResult(secondFile)),
        delete: vi.fn().mockResolvedValue(successResult(true))
      },
      pluginPKGFileResolver: {
        parsePluginZipFiles: vi.fn(),
        parsePluginPkg: vi
          .fn()
          .mockResolvedValueOnce(successResult(pluginPkgInfo(plugin({ pluginId: 'first' }))))
          .mockResolvedValueOnce(successResult(pluginPkgInfo(plugin({ pluginId: 'second' }))))
      }
    });

    const [uploaded, err] = await makePluginUploadUC(deps)({
      files: [
        { file: stream(), fileName: 'first.pkg' },
        { file: stream(), fileName: 'second.pkg' }
      ]
    });

    expect(err).toBeNull();
    expect(uploaded?.plugins.map((item) => item.pluginId)).toEqual(['first', 'second']);
    expect(deps.pluginRepo.createPlugin).toHaveBeenCalledTimes(2);
  });

  it('extracts zip uploads and stores every package as pending', async () => {
    const bundleFile = namedFileObject('bundle', 'bundle.zip');
    const firstFile = fileObject('first');
    const secondFile = fileObject('second');
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi.fn().mockResolvedValue(successResult(bundleFile)),
        delete: vi.fn().mockResolvedValue(successResult(true))
      },
      pluginPKGFileResolver: {
        parsePluginZipFiles: vi.fn().mockResolvedValue(successResult([firstFile, secondFile])),
        parsePluginPkg: vi
          .fn()
          .mockResolvedValueOnce(successResult(pluginPkgInfo(plugin({ pluginId: 'first' }))))
          .mockResolvedValueOnce(successResult(pluginPkgInfo(plugin({ pluginId: 'second' }))))
      }
    });

    const [uploaded, err] = await makePluginUploadUC(deps)({
      files: [{ file: stream(), fileName: 'bundle.zip' }]
    });

    expect(err).toBeNull();
    expect(uploaded?.plugins.map((item) => item.pluginId)).toEqual(['first', 'second']);
    expect(deps.pluginPKGFileResolver.parsePluginZipFiles).toHaveBeenCalledWith(bundleFile);
    expect(deps.pluginRepo.createPlugin).toHaveBeenCalledTimes(2);
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
        parsePluginZipFiles: vi.fn(),
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
        parsePluginZipFiles: vi.fn(),
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

  it('expands zip package downloads before direct installation', async () => {
    const zipFile = namedFileObject('bundle', 'bundle.zip', 'bundle-etag');
    const firstPkg = fileObject('first-pkg', 'first-etag');
    const secondPkg = fileObject('second-pkg', 'second-etag');
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi.fn().mockResolvedValue(successResult(zipFile))
      },
      pluginPKGFileResolver: {
        parsePluginZipFiles: vi.fn().mockResolvedValue(successResult([firstPkg, secondPkg])),
        parsePluginPkg: vi
          .fn()
          .mockResolvedValueOnce(successResult(pluginPkgInfo(plugin({ pluginId: 'first' }))))
          .mockResolvedValueOnce(successResult(pluginPkgInfo(plugin({ pluginId: 'second' }))))
      }
    });

    const [result, err] = await makePluginInstallUC(deps)({
      urls: ['https://example.com/plugins.zip'],
      batchDownloadSize: 1
    });

    expect(err).toBeNull();
    expect(result).toEqual({});
    expect(deps.localFileStorageRepo.save).toHaveBeenCalledWith({
      file: expect.any(Readable),
      fileKey: expect.any(String),
      fileName: 'plugins.zip'
    });
    expect(deps.pluginPKGFileResolver.parsePluginPkg).toHaveBeenCalledTimes(2);
    expect(deps.pluginRepo.createPlugin).toHaveBeenNthCalledWith(1, {
      files: files(),
      plugin: plugin({ pluginId: 'first' }),
      pending: false
    });
    expect(deps.pluginRepo.createPlugin).toHaveBeenNthCalledWith(2, {
      files: files(),
      plugin: plugin({ pluginId: 'second' }),
      pending: false
    });
  });

  it('reports extract failures for downloaded files', async () => {
    const zipFile = namedFileObject('bad', 'bad.zip', 'bad-etag');
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi.fn().mockResolvedValue(successResult(zipFile))
      },
      pluginPKGFileResolver: {
        parsePluginZipFiles: vi.fn().mockResolvedValue(failureResult(reason('extract failed'))),
        parsePluginPkg: vi.fn()
      }
    });

    const [result] = await makePluginInstallUC(deps)({
      urls: ['https://example.com/bad.zip'],
      batchDownloadSize: 1
    });

    expect(result?.failed).toEqual([
      {
        url: 'https://example.com/bad.zip',
        reason: reason('extract failed')
      }
    ]);
    expect(deps.pluginPKGFileResolver.parsePluginPkg).not.toHaveBeenCalled();
  });

  it('maps parse failures from zip entries back to the downloaded url', async () => {
    const zipFile = namedFileObject('bundle', 'bundle.zip', 'bundle-etag');
    const entryPkg = fileObject('entry-pkg', 'entry-etag');
    const deps = makeDeps({
      localFileStorageRepo: {
        save: vi.fn().mockResolvedValue(successResult(zipFile))
      },
      pluginPKGFileResolver: {
        parsePluginZipFiles: vi.fn().mockResolvedValue(successResult([entryPkg])),
        parsePluginPkg: vi.fn().mockResolvedValue(failureResult(reason('parse failed')))
      }
    });

    const [result] = await makePluginInstallUC(deps)({
      urls: ['https://example.com/plugins.zip'],
      batchDownloadSize: 1
    });

    expect(result?.failed).toEqual([
      {
        url: 'https://example.com/plugins.zip',
        reason: reason('parse failed')
      }
    ]);
  });

  it('uses an empty URL fallback when an install failure cannot be matched to a download', async () => {
    let metadataReads = 0;
    const shiftingFile = {
      get metaData() {
        metadataReads += 1;
        const fileKeys = [
          'initial-file-key',
          'failed-file-key',
          'installable-mismatch-file-key',
          'download-mismatch-file-key'
        ];
        return {
          fileKey: fileKeys[metadataReads - 1] ?? 'extra-mismatch-file-key',
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
          .mockResolvedValueOnce(successResult(fileObject('ghost')))
          .mockResolvedValueOnce(successResult(shiftingFile))
      },
      pluginPKGFileResolver: {
        parsePluginZipFiles: vi.fn(),
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
        parsePluginZipFiles: vi.fn(),
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
        parsePluginZipFiles: vi.fn(),
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
    expect(deps.pluginRuntimeManager.unregister).toHaveBeenCalledWith(
      {
        pluginId: uniqueId.pluginId,
        version: uniqueId.version,
        etag: 'old-etag'
      },
      { replacementUniqueId: uniqueId }
    );
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

  it('drains replaced runtimes to the confirmed plugin runtime', async () => {
    const oldPlugin = plugin({ etag: 'old' });
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        listActive: vi.fn().mockResolvedValue(successResult([oldPlugin])),
        getPendingPluginIds: vi.fn().mockResolvedValue(successResult([uniqueId])),
        confirmPlugin: vi.fn().mockResolvedValue(successResult(plugin())),
        disablePlugins: vi.fn().mockResolvedValue(successResult({}))
      })
    });

    const [result, err] = await makePluginConfirmUC(deps)({ uniqueIds: [uniqueId] });

    expect(err).toBeNull();
    expect(result).toEqual({});
    expect(deps.pluginRuntimeManager.unregister).toHaveBeenCalledWith(
      {
        pluginId: oldPlugin.pluginId,
        version: oldPlugin.version,
        etag: oldPlugin.etag
      },
      { replacementUniqueId: uniqueId }
    );
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

describe('makePluginDeleteUC', () => {
  const input = {
    pluginId: uniqueId.pluginId,
    source: 'system',
    version: uniqueId.version
  };

  const makeDeps = (overrides: Record<string, unknown> = {}) => ({
    pluginRepo: basePluginRepo({
      getPluginByUserPluginId: vi.fn().mockResolvedValue(successResult(plugin())),
      disablePlugins: vi.fn().mockResolvedValue(successResult({}))
    }),
    pluginRuntimeManager: baseRuntimeManager({
      unregister: vi.fn().mockResolvedValue(successResult({}))
    }),
    logger: logger(),
    ...overrides
  });

  it('disables the installed plugin resolved by source, plugin id, and version', async () => {
    const deps = makeDeps();

    const [result, err] = await makePluginDeleteUC(deps)(input);

    expect(err).toBeNull();
    expect(result).toEqual({});
    expect(deps.pluginRepo.getPluginByUserPluginId).toHaveBeenCalledWith(input);
    expect(deps.pluginRepo.disablePlugins).toHaveBeenCalledWith([uniqueId]);
    expect(deps.pluginRuntimeManager.unregister).toHaveBeenCalledWith(uniqueId);
  });

  it('returns failure when plugin cannot be resolved', async () => {
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        getPluginByUserPluginId: vi.fn().mockResolvedValue(failureResult(reason('not found')))
      })
    });

    const [, err] = await makePluginDeleteUC(deps)(input);

    expect(err?.reason.en).toBe('Plugin not found');
    expect(deps.pluginRepo.disablePlugins).not.toHaveBeenCalled();
  });

  it('returns failure when disabling the plugin fails', async () => {
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        getPluginByUserPluginId: vi.fn().mockResolvedValue(successResult(plugin())),
        disablePlugins: vi.fn().mockResolvedValue(failureResult(reason('disable failed')))
      })
    });

    const [, err] = await makePluginDeleteUC(deps)(input);

    expect(err?.reason.en).toBe('Failed to delete plugin');
    expect(deps.pluginRuntimeManager.unregister).not.toHaveBeenCalled();
  });

  it('logs unregister failures after disabling runnable plugins', async () => {
    const appLogger = logger();
    const deps = makeDeps({
      pluginRuntimeManager: baseRuntimeManager({
        unregister: vi.fn().mockResolvedValue(failureResult(reason('unregister failed')))
      }),
      logger: appLogger
    });

    const [result, err] = await makePluginDeleteUC(deps)(input);

    expect(err).toBeNull();
    expect(result).toEqual({});
    expect(appLogger.error).toHaveBeenCalledWith('Failed to unregister deleted plugin runtime', {
      pluginId: uniqueId.pluginId,
      source: input.source,
      version: uniqueId.version,
      etag: uniqueId.etag,
      error: expect.objectContaining({
        reason: reason('unregister failed')
      })
    });
  });

  it('logs unregister exceptions after disabling runnable plugins', async () => {
    const unregisterError = new Error('runtime cache missed');
    const appLogger = logger();
    const deps = makeDeps({
      pluginRuntimeManager: baseRuntimeManager({
        unregister: vi.fn().mockRejectedValue(unregisterError)
      }),
      logger: appLogger
    });

    const [result, err] = await makePluginDeleteUC(deps)(input);

    expect(err).toBeNull();
    expect(result).toEqual({});
    expect(appLogger.error).toHaveBeenCalledWith('Failed to unregister deleted plugin runtime', {
      pluginId: uniqueId.pluginId,
      source: input.source,
      version: uniqueId.version,
      etag: uniqueId.etag,
      error: unregisterError
    });
  });

  it('does not unregister non-runnable plugins', async () => {
    const deps = makeDeps({
      pluginRepo: basePluginRepo({
        getPluginByUserPluginId: vi.fn().mockResolvedValue(successResult(nonRunnablePlugin())),
        disablePlugins: vi.fn().mockResolvedValue(successResult({}))
      })
    });

    const [result, err] = await makePluginDeleteUC(deps)(input);

    expect(err).toBeNull();
    expect(result).toEqual({});
    expect(deps.pluginRuntimeManager.unregister).not.toHaveBeenCalled();
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
    const appLogger = logger();
    const deps = {
      pluginRepo: basePluginRepo({
        disablePlugins: vi.fn().mockResolvedValue(failureResult(reason('disable failed')))
      }),
      pluginRuntimeManager: baseRuntimeManager(),
      logger: appLogger,
      replacedPlugins: [plugin({ etag: 'old' })]
    };

    const [, err] = await disableAndUnregisterReplacedPlugins(deps);

    expect(err?.reason.en).toBe('Failed to disable replaced plugins');
    expect(appLogger.error).toHaveBeenCalledWith(
      'Plugin Replace Active Disable Error',
      expect.objectContaining({
        replacedPluginIds: [{ ...uniqueId, etag: 'old' }],
        error: expect.objectContaining({
          reason: {
            en: 'Failed to disable replaced plugins',
            'zh-CN': '禁用被替换插件失败'
          },
          message: 'Failed to disable replaced plugins',
          error: expect.objectContaining({
            message: 'Failed to disable replaced plugins',
            cause: expect.objectContaining({
              message: 'disable failed'
            })
          })
        })
      })
    );
  });

  it('logs unregister failures and still completes replacement cleanup', async () => {
    const appLogger = logger();
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
      logger: appLogger,
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
    expect(appLogger.error).toHaveBeenCalledTimes(2);
  });
});
