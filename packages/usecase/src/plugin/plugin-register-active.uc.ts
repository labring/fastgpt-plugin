import type { PluginType } from '@domain/entities/plugin.entity';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { PluginUniqueIdSchema } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import type { UsecaseLogger } from '@usecase/logger.port';

export type PluginRegisterActiveUCDeps = {
  pluginRepo: PluginRepoPort;
  pluginRuntimeManager: PluginRuntimeManagerPort;
  logger: UsecaseLogger;
};

type Output = Promise<Result>;

const isRunnablePlugin = (plugin: PluginType) => plugin.type === 'tool';

export const makePluginRegisterActiveUC =
  (deps: PluginRegisterActiveUCDeps) => async (): Output => {
    deps.logger.debug('Plugin Register Active');

    const [plugins, listErr] = await deps.pluginRepo.listActive();

    if (listErr) {
      return failureResult(
        {
          en: 'Failed to get active plugins',
          'zh-CN': '获取 active 插件失败'
        },
        listErr
      );
    }

    for (const plugin of plugins) {
      if (!isRunnablePlugin(plugin)) {
        continue;
      }

      const uniqueId = PluginUniqueIdSchema.parse(plugin);
      deps.logger.debug('Plugin Register Active One', {
        uniqueId
      });

      const [, registerErr] = await deps.pluginRuntimeManager.register(uniqueId);
      if (registerErr) {
        return failureResult(
          {
            en: 'Failed to register active plugin',
            'zh-CN': '注册 active 插件失败'
          },
          registerErr
        );
      }
    }

    return successResult('ok');
  };
