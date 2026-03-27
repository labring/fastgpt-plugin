import {
  type PluginType,
  type PluginTypeType
} from '@fastgpt-plugin/domain/entities/plugin.entity';
import {
  SystemModeEnum,
  type SystemModeType
} from '@fastgpt-plugin/domain/value-objects/system-mode.enum';

export type PluginManagerConfig =
  | {
      mode: typeof SystemModeEnum.local;
      /** 全局最大 Pod 总数（IPC 模式） */
      maxTotalPods?: number;
      /** 健康检查间隔（ms） */
      healthCheckInterval?: number;
    }
  | {
      mode: typeof SystemModeEnum.remote;
      // not implemented yet
    }
  | {
      mode: typeof SystemModeEnum.serverless;
      // not implemented yet
    };

export interface PluginManagerEvents {
  pluginRegistered: (event: { pluginId: string; type: PluginTypeType }) => void;
  pluginUnregistered: (event: { pluginId: string }) => void;
  pluginUnhealthy: (event: { pluginId: string; reason: string }) => void;
  quotaExceeded: (event: { current: number; max: number }) => void;
  healthCheck: (event: { timestamp: number; plugins: string[] }) => void;
}

export interface PluginRuntimeManagerPort<Mode extends SystemModeType> {
  register(id: string, options: Mode): Promise<void>;
  unregister(): Promise<void>;
}
