import type { PluginRuntimeConfigType } from '@domain/entities/plugin.entity';
import type {
  PluginInvokeEventNameType,
  PluginRuntimeInvokeOptions,
  PluginRuntimeManagerPort
} from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { PluginUniqueIdType } from '@domain/value-objects/plugin.vo';
import type { Result } from '@domain/value-objects/result.vo';
import type { StreamData } from '@domain/value-objects/stream.vo';

export class CompositePluginRuntimeManager<Config extends PluginRuntimeConfigType = PluginRuntimeConfigType>
  implements PluginRuntimeManagerPort<Config>
{
  constructor(
    private readonly deps: {
      primary: PluginRuntimeManagerPort<Config>;
      debug: PluginRuntimeManagerPort<PluginRuntimeConfigType>;
    }
  ) {}

  register(uniqueId: PluginUniqueIdType, options?: unknown): Promise<Result> {
    return this.deps.primary.register(uniqueId, options as never);
  }

  unregister(
    uniqueId: PluginUniqueIdType,
    options?: { replacementUniqueId?: PluginUniqueIdType }
  ): Promise<Result> {
    return this.deps.primary.unregister(uniqueId, options);
  }

  getConfig(pluginId: string): Promise<Result<Config>> {
    return this.deps.primary.getConfig(pluginId);
  }

  updateConfig(pluginId: string, config: Config): Promise<Result> {
    return this.deps.primary.updateConfig(pluginId, config);
  }

  resetConfig(pluginId: string): Promise<Result> {
    return this.deps.primary.resetConfig(pluginId);
  }

  status(uniqueId: PluginUniqueIdType): Promise<Result<unknown>> {
    return this.deps.primary.status(uniqueId);
  }

  globalStatus(): Promise<Result<unknown>> {
    return this.deps.primary.globalStatus();
  }

  shutdown(timeout?: number): Promise<Result> {
    return this.deps.primary.shutdown(timeout);
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

    return this.deps.primary.invoke(arg0);
  }
}
