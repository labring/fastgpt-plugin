import z from 'zod';

import type { InvokePort } from '@domain/ports/invoke.port';
import type { StreamData } from '@domain/value-objects/stream.vo';

import type { PluginRuntimeConfigType } from '../../entities/plugin.entity';
import type { PluginTypeType } from '../../entities/plugin-base.entity';
import type { PluginUniqueIdType } from '../../value-objects/plugin.vo';
import type { Result } from '../../value-objects/result.vo';

export const PluginInvokeEventnameSchema = z.enum(['run', 'check']);
export type PluginInvokeEventNameType = z.infer<typeof PluginInvokeEventnameSchema>;
export const PluginInvokeEventnameEnum = PluginInvokeEventnameSchema.enum;

export type PluginRuntimeInvokeOptions = {
  invocationId?: string;
  invoke?: InvokePort;
  timeout?: number;
  priority?: number;
  debug?: {
    tmbId?: string;
    userId?: string;
    source?: string;
  };
};

/**
 * PluginRuntimeManager 运行时的插件管理器
 */
export interface PluginRuntimeManagerPort<
  Config extends PluginRuntimeConfigType = PluginRuntimeConfigType,
  PluginStatus = unknown,
  RegisterOptions = unknown
> {
  /**
   * 注册 Plugin
   */
  register(uniqueId: PluginUniqueIdType, options?: RegisterOptions): Promise<Result>;

  /**
   * 注销 Plugin,
   */
  unregister(
    uniqueId: PluginUniqueIdType,
    options?: {
      replacementUniqueId?: PluginUniqueIdType;
    }
  ): Promise<Result>;

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

/** 各插件类型允许调用的事件。新增插件类型时必须在这里补一行 */
export const PluginTypeEventNames = {
  tool: ['run'],
  moderation: ['check']
} as const satisfies Record<PluginTypeType, readonly PluginInvokeEventNameType[]>;

/** 该插件类型是否允许调用该事件（运行时门禁的唯一来源） */
export function isPluginEventSupported(type: PluginTypeType, eventName: string): boolean {
  return (PluginTypeEventNames[type] as readonly string[]).includes(eventName);
}

/**
 * 任一插件类型允许的事件。debug 通道在不知道插件类型时用它保留显式事件边界，
 * 不能只放行 `run`。
 */
export function isKnownPluginEvent(eventName: string): boolean {
  return Object.values(PluginTypeEventNames).some((names) =>
    (names as readonly string[]).includes(eventName)
  );
}
