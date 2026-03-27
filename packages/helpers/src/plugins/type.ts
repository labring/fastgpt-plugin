import z from 'zod';
import { I18nStringSchema } from '../common/schemas/i18n';

export const PluginSourceSchema = z.enum(['system', 'user']);
export const PluginSourceEnum = PluginSourceSchema.enum;

export const PluginChildSchema = z.object({
  id: z.string(),
  name: I18nStringSchema,
  description: I18nStringSchema.optional(),
  icon: z.string().optional(),
  inputSchema: z.any().optional(),
  outputSchema: z.any().optional()
});

export const PluginVersionItemSchema = z.object({
  /** 版本号（semver 格式） */
  version: z.string(),
  /** .pkg 文件 SHA256 前 12 位，唯一标识内容 */
  etag: z.string(),
  versionDescription: I18nStringSchema.optional(),
  inputSchema: z.any().optional(),
  outputSchema: z.any().optional(),
  secretSchema: z.any().optional(),
  children: z.array(PluginChildSchema).optional(),
  createdAt: z.date().optional()
});

export type PluginVersionItemType = z.infer<typeof PluginVersionItemSchema>;

export const PluginSchema = z.object({
  type: PluginTypeSchema,
  pluginId: z.string()

  // // Meta 信息（随最新版本更新）
  // author: z.string(),
  // name: I18nStringSchema,
  // description: I18nStringSchema.optional(),
  // toolDescription: z.string(),
  // icon: z.string().optional(),
  // tags: z.array(z.string()).optional(),
  // tutorialUrl: z.string().optional(),
  // readmeUrl: z.string().optional(),

  // /** 版本列表，按 semver 排序，最后一个元素为最新版 */
  // versionList: z.array(PluginVersionItemSchema)
});
