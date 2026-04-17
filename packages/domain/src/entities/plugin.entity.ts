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

// 插件配置类型, 抽象类型，由具体运行时实现
export type PluginRuntimeConfigType = object;

// 当前只支持 tool。之前把 PluginBaseSchema 放在 union 前面会导致 tool 扩展字段被 strip 掉。
export const PluginSchema = ToolSchema;

export type PluginType = ToolType; // TODO: add more types of plugin
