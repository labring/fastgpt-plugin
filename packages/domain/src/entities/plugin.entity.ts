import z from 'zod';

import { ToolSchema, type ToolType } from './tool.entity';
export {
  PluginBaseSchema,
  type PluginBaseType,
  PluginTagEnum,
  PluginTagSchema,
  type PluginTagType,
  PluginTypeEnum,
  PluginTypeSchema,
  type PluginTypeType
} from './plugin-base.entity';
import { PluginBaseSchema, type PluginBaseType } from './plugin-base.entity';

// 插件配置类型, 抽象类型，由具体运行时实现
export type PluginRuntimeConfigType = object;

export const PluginSchema = z.union([PluginBaseSchema, ToolSchema]);

export type PluginType = PluginBaseType | ToolType; // TODO: add more types of plugin
