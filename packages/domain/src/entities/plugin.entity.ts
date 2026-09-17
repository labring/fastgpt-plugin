import z from 'zod';

import { ModerationSchema, type ModerationType } from './moderation.entity';
import { PluginTypeEnum, type PluginTypeType } from './plugin-base.entity';
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

// 不能用「PluginBaseSchema 在前 + 具体 schema」的普通 union：PluginBaseSchema 在前会把具体
// 类型的扩展字段 strip 掉。discriminatedUnion 要求每个成员自带 `type` 的 z.literal 判别符，
// 因此新增插件类型时必须同时加一条成员与一个 literal。
export const PluginSchema = z.discriminatedUnion('type', [ToolSchema, ModerationSchema]);

export type PluginType = ToolType | ModerationType;

/** 需要注册到运行时并接受 invoke 的插件类型 */
export const RunnablePluginTypes = [PluginTypeEnum.tool, PluginTypeEnum.moderation] as const;

export const isRunnablePluginType = (type: PluginTypeType): boolean =>
  (RunnablePluginTypes as readonly PluginTypeType[]).includes(type);
