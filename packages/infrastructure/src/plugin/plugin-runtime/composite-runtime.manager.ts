import type { PluginRuntimeConfigType } from '@domain/entities/plugin.entity';
import type {
  PluginInvokeEventNameType,
  PluginRuntimeInvokeOptions,
  PluginRuntimeManagerPort
} from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import type { Result } from '@domain/value-objects/result.vo';
import type { StreamData } from '@domain/value-objects/stream.vo';

export type CompositeRuntimeMode = 'primary' | 'coworkerd';

export class CompositePluginRuntimeManager
  implements PluginRuntimeManagerPort<PluginRuntimeConfigType>
{
  private readonly selectedPrimary: PluginRuntimeManagerPort<PluginRuntimeConfigType>;

  constructor(
    private readonly deps: {
      primary?: PluginRuntimeManagerPort<any>;
      coworkerd?: PluginRuntimeManagerPort<any>;
      debug: PluginRuntimeManagerPort<any>;
      mode?: CompositeRuntimeMode;
    }
  ) {
    const selected = deps.mode === 'coworkerd' ? deps.coworkerd : deps.primary;
    if (!selected) {
      throw new Error(
        deps.mode === 'coworkerd'
          ? 'Coworkerd runtime mode requires a Coworkerd runtime manager'
          : 'Primary runtime mode requires a primary runtime manager'
      );
    }
    this.selectedPrimary = selected as PluginRuntimeManagerPort<PluginRuntimeConfigType>;
  }

  register(uniqueId: PluginUniqueIdType, options?: unknown): Promise<Result> {
    return this.selectedPrimary.register(uniqueId, options as never);
  }

  unregister(
    uniqueId: PluginUniqueIdType,
    options?: { replacementUniqueId?: PluginUniqueIdType }
  ): Promise<Result> {
    return this.selectedPrimary.unregister(uniqueId, options);
  }

  getConfig(pluginId: string): Promise<Result<PluginRuntimeConfigType>> {
    return this.selectedPrimary.getConfig(pluginId);
  }

  updateConfig(pluginId: string, config: PluginRuntimeConfigType): Promise<Result> {
    return this.selectedPrimary.updateConfig(pluginId, config);
  }

  resetConfig(pluginId: string): Promise<Result> {
    return this.selectedPrimary.resetConfig(pluginId);
  }

  status(uniqueId: PluginUniqueIdType): Promise<Result<unknown>> {
    return this.selectedPrimary.status(uniqueId);
  }

  globalStatus(): Promise<Result<unknown>> {
    return this.selectedPrimary.globalStatus();
  }

  shutdown(timeout?: number): Promise<Result> {
    return this.selectedPrimary.shutdown(timeout);
  }

  invoke<
    R = unknown,
    S extends boolean = boolean,
    E extends PluginInvokeEventNameType = PluginInvokeEventNameType,
    P = unknown
  >(arg0: {
    uniqueId: PluginUniqueIdType;
    eventName: E;
    payload: P;
    returnStream: S;
    options?: PluginRuntimeInvokeOptions;
  }): Promise<Result<S extends true ? StreamData<R> : R>> {
    if (arg0.options?.debug) {
      return this.deps.debug.invoke(arg0) as Promise<Result<S extends true ? StreamData<R> : R>>;
    }

    return this.selectedPrimary.invoke(arg0);
  }
}
