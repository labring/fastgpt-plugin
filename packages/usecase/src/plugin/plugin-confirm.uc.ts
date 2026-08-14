/**
 * Usecase Description
 * Description：After upload the pkg file. The User need to confirm the file.
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { PluginSourceType, PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
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
  source?: PluginSourceType;
};

/** Output Type */
type Output = Promise<Result>;

export const makePluginConfirmUC =
  (deps: PluginConfirmUCDeps) =>
  async ({ uniqueIds, source: inputSource }: Input): Output => {
    const source = inputSource ?? 'system';
    deps.logger.debug('Plugin Confirm', { uniqueIds, source });

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

      // confirmPlugin performs the source-scoped pending lookup atomically with confirmation.
      const [plugin, err] = await deps.pluginRepo.confirmPlugin(uniqueId, source);

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

      // Register the plugin to runtime only when this source confirmed the first entity.
      if (plugin.type === 'tool') {
        if (plugin.runtimeRegistrationRequired !== false) {
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
