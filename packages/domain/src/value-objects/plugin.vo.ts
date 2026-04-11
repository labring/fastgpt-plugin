import z from 'zod';

import { I18nStringStrictSchema } from './i18n-string.vo';

export const PluginUniqueIdSchema = z.object({
  pluginId: z.string(),
  version: z.string(),
  etag: z.string()
});

export type PluginUniqueIdType = z.infer<typeof PluginUniqueIdSchema>;

export const PluginSourceSchema = z.enum(['system', 'user']);
export const PluginSourceEnum = PluginSourceSchema.enum;
export type PluginSourceType = z.infer<typeof PluginSourceSchema>;

export const PluginTagListSchema = z.array(z.record(z.string(), I18nStringStrictSchema));
export type PluginTagListType = z.infer<typeof PluginTagListSchema>;

export const PluginRuntimeModeSchema = z.enum(['localPool', 'serverless']);
export type PluginRuntimeModeType = z.infer<typeof PluginRuntimeModeSchema>;
export const PluginRuntimeModeEnum = PluginRuntimeModeSchema.enum;
