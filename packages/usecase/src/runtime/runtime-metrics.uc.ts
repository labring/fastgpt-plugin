/**
 * Usecase Description
 * Description：Get Pool metrics status
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import { failureResult, type Result, successResult } from '@domain/value-objects/result.vo';
import { toUsecaseErrorLog } from '@usecase/log-error';
import type { UsecaseLogger } from '@usecase/logger.port';
/** Dependencies */
export type RuntimeMetricsUCDeps = {
  pluginRuntimeManager: PluginRuntimeManagerPort;
  logger: UsecaseLogger;
};

/** Input Type*/
type Input = object;

/** Output Type */
type Output = Promise<Result<unknown>>;

export const makeRuntimeMetricsUC =
  ({ logger, pluginRuntimeManager }: RuntimeMetricsUCDeps) =>
  async (_input: Input): Output => {
    logger.debug('Runtime Metrics');
    const [result, error] = await pluginRuntimeManager.globalStatus();
    if (error) {
      logger.error('Runtime Metrics Error', toUsecaseErrorLog(error));
      return failureResult(error);
    }
    return successResult(result);
  };
