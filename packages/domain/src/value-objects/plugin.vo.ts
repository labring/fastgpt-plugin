import z from 'zod';

export const PluginUniqueIdSchema = z.object({
  pluginId: z.string(),
  version: z.string(),
  etag: z.string()
});

export type PluginUniqueIdType = z.infer<typeof PluginUniqueIdSchema>;

export const PluginSourceSchema = z.enum(['system', 'user']);
export const PluginSourceEnum = PluginSourceSchema.enum;
export type PluginSourceType = z.infer<typeof PluginSourceSchema>;
