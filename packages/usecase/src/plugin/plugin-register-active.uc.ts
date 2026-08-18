import type { PluginType } from '@domain/entities/plugin.entity';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { normalizeToError, serializeError } from '@domain/value-objects/error.vo';
import { PluginUniqueIdSchema, type PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { isResultFailure, toUsecaseErrorLog } from '@usecase/log-error';
import type { UsecaseLogger } from '@usecase/logger.port';

export type PluginRegisterActiveUCDeps = {
  pluginRepo: PluginRepoPort;
  pluginRuntimeManager: PluginRuntimeManagerPort;
  logger: UsecaseLogger;
  registerConcurrency?: number;
};

type Output = Promise<Result>;

const isRunnablePlugin = (plugin: PluginType) => plugin.type === 'tool';

type RegisterFailure = {
  uniqueId?: PluginUniqueIdType;
  error: unknown;
};

const runWithConcurrency = async <T>(
  items: T[],
  concurrency: number,
  task: (item: T) => Promise<void>
): Promise<void> => {
  let nextIndex = 0;
  const normalizedConcurrency = Number.isFinite(concurrency) ? Math.floor(concurrency) : 1;
  const workerCount = Math.min(Math.max(1, normalizedConcurrency), items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex++];
        await task(item);
      }
    })
  );
};

const toRegisterFailureLog = (error: unknown) => {
  if (isResultFailure(error)) {
    return toUsecaseErrorLog(error);
  }

  return {
    error: serializeError(normalizeToError(error), { includeStack: true })
  };
};

export const makePluginRegisterActiveUC =
  (deps: PluginRegisterActiveUCDeps) => async (): Output => {
    deps.logger.debug('Plugin Register Active');

    const [plugins, listErr] = await deps.pluginRepo.listActive();

    if (listErr) {
      deps.logger.error('Plugin Register Active List Error', toUsecaseErrorLog(listErr));
      return failureResult(
        {
          en: 'Failed to get active plugins',
          'zh-CN': '获取 active 插件失败'
        },
        listErr
      );
    }

    const runnablePlugins = plugins.filter(isRunnablePlugin);
    const failures: RegisterFailure[] = [];

    await runWithConcurrency(
      runnablePlugins,
      deps.registerConcurrency ?? 1,
      async (plugin) => {
        let uniqueId: RegisterFailure['uniqueId'];

        try {
          uniqueId = PluginUniqueIdSchema.parse(plugin);
          deps.logger.debug('Plugin Register Active One', {
            uniqueId
          });

          const [, registerErr] = await deps.pluginRuntimeManager.register(uniqueId);
          if (registerErr) {
            failures.push({ uniqueId, error: registerErr });
          }
        } catch (error) {
          failures.push({ uniqueId, error });
        }
      }
    );

    if (failures.length > 0) {
      for (const failure of failures) {
        deps.logger.error('Plugin Register Active One Error', {
          uniqueId: failure.uniqueId,
          error: toRegisterFailureLog(failure.error)
        });
      }

      const firstFailure = failures[0];
      return failureResult({
        reason: {
          en: 'Failed to register active plugin',
          'zh-CN': '注册 active 插件失败'
        },
        error: normalizeToError(firstFailure.error),
        data: {
          failures: failures.map((failure) => ({
            uniqueId: failure.uniqueId,
            error: toRegisterFailureLog(failure.error)
          }))
        }
      });
    }

    return successResult('ok');
  };
