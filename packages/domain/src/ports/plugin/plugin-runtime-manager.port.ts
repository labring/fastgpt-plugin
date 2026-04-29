import z from 'zod';

import type { InvokePort } from '@domain/ports/invoke.port';
import type { StreamData } from '@domain/value-objects/stream.vo';

import type { PluginRuntimeConfigType } from '../../entities/plugin.entity';
import type { PluginRuntimeModeType, PluginUniqueIdType } from '../../value-objects/plugin.vo';
import type { Result } from '../../value-objects/result.vo';

export const PluginInvokeEventnameSchema = z.enum(['run']);
export type PluginInvokeEventNameType = z.infer<typeof PluginInvokeEventnameSchema>;
export const PluginInvokeEventnameEnum = PluginInvokeEventnameSchema.enum;

export type PluginRuntimeInvokeOptions = {
  invocationId?: string;
  invoke?: InvokePort;
  timeout?: number;
  priority?: number;
};

/**
 * PluginRuntimeManager 运行时的插件管理器
 */
export interface PluginRuntimeManagerPort<
  Config extends PluginRuntimeConfigType = PluginRuntimeConfigType,
  PluginStatus = unknown
> {
  /**
   * 注册 Plugin
   */
  register(uniqueId: PluginUniqueIdType, config?: Config): Promise<Result>;

  /**
   * 注销 Plugin,
   */
  unregister(uniqueId: PluginUniqueIdType): Promise<Result>;

  /**
   * 获取插件的配置
   */
  getConfig(pluginId: string): Promise<Result<Config>>;

  /**
   * 更新插件配置
   */
  updateConfig(pluginId: string, config: Config): Promise<Result>;

  /**
   * 重置插件配置
   */
  resetConfig(pluginId: string): Promise<Result>;

  /**
   * 获取插件状态
   */
  status(uniqueId: PluginUniqueIdType): Promise<Result<PluginStatus>>;

  /**
   * 获取全局插件状态
   */
  globalStatus(): Promise<Result<unknown>>;

  /**
   * 优雅关闭，拒绝所有新操作，等待所有插件执行结束
   * 超时则直接关闭
   */
  shutdown(timeout?: number): Promise<Result>;

  /** 调用某个插件的方法
   * 泛型在最上层（上层 Manager）或最下层（SDK和插件构建工厂中）实现就行
   */
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
    // sendStream?: boolean
  }): Promise<Result<S extends true ? StreamData<R> : R>>;
}
