import z from 'zod';

import { I18nStringStrictSchema } from './i18n-string.vo';

export const PluginUniqueIdSchema = z.object({
  pluginId: z.string(),
  version: z.string(),
  etag: z.string()
});

export type PluginUniqueIdType = z.infer<typeof PluginUniqueIdSchema>;

export const PluginSourceSchema = z.literal('system').or(z.string());
export type PluginSourceType = z.infer<typeof PluginSourceSchema>;

export const PluginTagListItemSchema = z.object({
  id: z.string(),
  name: I18nStringStrictSchema
});
export const PluginTagListSchema = z.array(PluginTagListItemSchema);
export type PluginTagListItemType = z.infer<typeof PluginTagListItemSchema>;
export type PluginTagListType = z.infer<typeof PluginTagListSchema>;

const rawPluginRuntimeModeSchema = z.enum(['localPool', 'serverless', 'unknown']);
export const PluginRuntimeModeEnum = rawPluginRuntimeModeSchema.enum;
export const PluginRuntimeModeSchema = rawPluginRuntimeModeSchema.catch(
  PluginRuntimeModeEnum.unknown
);
export type PluginRuntimeModeType = z.infer<typeof PluginRuntimeModeSchema>;

// 用户视角能看到的 Plugin ID，去掉了 etag，因为用户不需要关心 etag，通过 source 来定位唯一插件
export const UserPluginIdSchema = z.object({
  pluginId: z.string(),
  version: z.string().optional(), // 可选，如果没填，则认为是最新版本
  source: PluginSourceSchema.optional() // 可选，如果没填，则认为是 system
});

export type UserPluginIdType = z.infer<typeof UserPluginIdSchema>;
