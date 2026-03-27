import type { PluginUniqueIdType } from '@fastgpt-plugin/domain/value-objects/plugin.vo';
import {
  SystemModeEnum,
  type SystemModeType
} from '@fastgpt-plugin/domain/value-objects/system-mode.enum';
import type { PoolServiceConfigSchema } from './ipc-process-pool';

export type PluginRecordItemType<Mode extends SystemModeType> =
  // id type
  PluginUniqueIdType & Mode extends typeof SystemModeEnum.local
    ? {
        filePath: string;
      } & PoolServiceConfigSchema
    : never;
