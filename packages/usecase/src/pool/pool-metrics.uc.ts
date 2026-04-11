/**
 * Usecase Description
 * Description：Get Pool metrics status
 * Version：v1.0.0
 * Author：FinleyGe
 */

import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { Result } from '@domain/value-objects/result.vo';
/** Dependencies */
type Deps = { pluginRuntimeManager: PluginRuntimeManagerPort };

/** Input Type*/
type Input = object;

/** Output Type */
type Output = Promise<Result<unknown>>;

export const makePoolMetricsUC =
  (deps: Deps) =>
  async (_input: Input): Output => {
    return deps.pluginRuntimeManager.globalStatus();
  };
