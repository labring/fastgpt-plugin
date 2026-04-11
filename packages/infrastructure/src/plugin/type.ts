import type { PluginTypeType } from '@domain/entities/plugin.entity';
import type { PluginRuntimeModeEnum } from '@domain/value-objects/plugin.vo';

export type PluginManagerConfig =
  | {
      mode: (typeof PluginRuntimeModeEnum)['localPool'];
      /** 全局最大 Pod 总数（IPC 模式） */
      maxTotalPods?: number;
      /** 健康检查间隔（ms） */
      healthCheckInterval?: number;
    }
  | {
      mode: typeof PluginRuntimeModeEnum.serverless;
      // not implemented yet
    };

export interface PluginManagerEvents {
  pluginRegistered: (event: { pluginId: string; type: PluginTypeType }) => void;
  pluginUnregistered: (event: { pluginId: string }) => void;
  pluginUnhealthy: (event: { pluginId: string; reason: string }) => void;
  quotaExceeded: (event: { current: number; max: number }) => void;
  healthCheck: (event: { timestamp: number; plugins: string[] }) => void;
}
