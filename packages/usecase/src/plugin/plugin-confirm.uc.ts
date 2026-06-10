/**
 * Usecase Description
 * Description：After upload the pkg file. The User need to confirm the file.
 * Version：v1.0.0
 * Author：FinleyGe
 */

import { isEqual } from 'es-toolkit';

import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { toUsecaseErrorLog } from '@usecase/log-error';
import type { UsecaseLogger } from '@usecase/logger.port';

import {
  disableAndUnregisterReplacedPlugins,
  listReplacedActivePlugins
} from './plugin-replace-active';

/** Dependencies */
export type PluginConfirmUCDeps = {
  pluginRepo: PluginRepoPort;
  pluginRuntimeManager: PluginRuntimeManagerPort;
  logger: UsecaseLogger;
};

/** Input Type*/
type Input = {
  uniqueIds: PluginUniqueIdType[];
};

/** Output Type */
type Output = Promise<Result>;

export const makePluginConfirmUC =
  (deps: PluginConfirmUCDeps) =>
  async ({ uniqueIds }: Input): Output => {
    deps.logger.debug('Plugin Confirm', { uniqueIds });

    const confirmOne = async (uniqueId: PluginUniqueIdType): Output => {
      deps.logger.debug('Plugin Confirm One', { uniqueId });

      const [replacedPlugins, replacedErr] = await listReplacedActivePlugins(
        deps.pluginRepo,
        uniqueId
      );

      if (replacedErr) {
        deps.logger.error('Plugin Confirm Replaced Active List Error', {
          uniqueId,
          error: toUsecaseErrorLog(replacedErr)
        });
        return failureResult(
          {
            en: 'Failed to get active plugins',
            'zh-CN': '获取 active 插件失败'
          },
          replacedErr
        );
      }

      // 1. get pending plugins
      const [pendingIds, pendingErr] = await deps.pluginRepo.getPendingPluginIds();

      if (pendingErr) {
        deps.logger.error('Plugin Confirm Pending List Error', {
          uniqueId,
          error: toUsecaseErrorLog(pendingErr)
        });
        return failureResult(
          {
            en: 'Failed to get pending plugins',
            'zh-CN': '获取待确认插件失败'
          },
          pendingErr
        );
      }

      // 2. check the id
      if (!pendingIds.some((pendingId) => isEqual(pendingId, uniqueId))) {
        return failureResult({
          en: 'Pending Plugin not found',
          'zh-CN': '待确认插件未找到'
        });
      }

      // 3. remove pending status
      const [plugin, err] = await deps.pluginRepo.confirmPlugin(uniqueId);

      if (err) {
        deps.logger.error('Plugin Confirm One Error', {
          uniqueId,
          error: toUsecaseErrorLog(err)
        });
        return failureResult(
          {
            en: 'Failed to confirm plugin',
            'zh-CN': '确认插件失败'
          },
          err
        );
      }

      // 4. register the plugin to runtime (when it is runable)
      if (plugin.type === 'tool') {
        const [, registerErr] = await deps.pluginRuntimeManager.register(uniqueId);
        if (registerErr) {
          deps.logger.error('Plugin Confirm Register Runtime Error', {
            uniqueId,
            error: toUsecaseErrorLog(registerErr)
          });
          return failureResult(
            {
              en: 'Failed to register confirmed plugin',
              'zh-CN': '注册确认后的插件失败'
            },
            registerErr
          );
        }

        const [, replaceErr] = await disableAndUnregisterReplacedPlugins({
          ...deps,
          replacementUniqueId: uniqueId,
          replacedPlugins
        });

        if (replaceErr) {
          deps.logger.error('Plugin Confirm Replace Active Error', {
            uniqueId,
            error: toUsecaseErrorLog(replaceErr)
          });
          return failureResult(replaceErr);
        }

        return successResult({});
      }

      // 5. (unimplemented) when it is not runable(model, workflow ...) cache it here or a plugin cache manager.
      return failureResult({
        en: 'Plugin type is not supported',
        'zh-CN': '插件类型不支持'
      });
    };

    for (const uniqueId of uniqueIds) {
      const [, err] = await confirmOne(uniqueId);
      if (err) {
        deps.logger.error('Plugin Confirm Error', {
          uniqueId,
          error: toUsecaseErrorLog(err)
        });
        return failureResult(err);
      }
    }

    return successResult({});
  };
