/**
 * Usecase Description
 * Description：Get Pool metrics status
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { Result } from '@domain/value-objects/result.vo';
/** Dependencies */
export type RuntimeMetricsUCDeps = { pluginRuntimeManager: PluginRuntimeManagerPort };

/** Input Type*/
type Input = object;

/** Output Type */
type Output = Promise<Result<unknown>>;

export const makeRuntimeMetricsUC =
  (deps: RuntimeMetricsUCDeps) =>
  async (_input: Input): Output => {
    return deps.pluginRuntimeManager.globalStatus();
  };
