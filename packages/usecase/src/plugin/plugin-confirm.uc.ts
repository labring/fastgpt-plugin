/**
 * Usecase Description
 * Description：After upload the pkg file. The User need to confirm the file.
 * Version：v1.0.0
 * Author：FinleyGe
 */

import { deepEqual } from 'assert';

import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import { failureResult, type Result } from '@domain/value-objects/result.vo';

/** Dependencies */
export type PluginConfirmUCDeps = {
  pluginRepo: PluginRepoPort;
  pluginRuntimeManager: PluginRuntimeManagerPort;
};

/** Input Type*/
type Input = {
  uniqueId: PluginUniqueIdType;
};

/** Output Type */
type Output = Promise<Result>;

export const makePluginConfirmUC =
  (deps: PluginConfirmUCDeps) =>
  async ({ uniqueId }: Input): Output => {
    // 1. get pending plugins
    const [pendingIds, pendingErr] = await deps.pluginRepo.getPendingPluginIds();

    if (pendingErr) {
      return failureResult(
        {
          en: 'Failed to get pending plugins',
          'zh-CN': '获取待确认插件失败'
        },
        pendingErr
      );
    }

    // 2. check the id
    //
    if (!pendingIds.some((pendingId) => deepEqual(pendingId, uniqueId))) {
      return failureResult({
        en: 'Pending Plugin not found',
        'zh-CN': '待确认插件未找到'
      });
    }

    // 3. remove pending status
    const [plugin, err] = await deps.pluginRepo.confirmPlugin(uniqueId);

    if (err) {
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
      return deps.pluginRuntimeManager.register(uniqueId);
    }

    // 5. (unimplemented) when it is not runable(model, workflow ...) cache it here or a plugin cache manager.
    return failureResult({
      en: 'Plugin type is not supported',
      'zh-CN': '插件类型不支持'
    });
  };
