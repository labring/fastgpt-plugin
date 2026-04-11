import z from 'zod';
import { PluginBaseSchema, PluginTypeEnum } from '../../entities/plugin.entity';
import { I18nStringSchema } from '../i18n-string.vo';

export const PluginManifestBaseSchema = z.object({
  ...PluginBaseSchema.omit({
    etag: true, // 上传后在服务器内自动计算 md5
    readmeUrl: true, // 不需要手动指定, 自动处理
    source: true // 上传时确定
  }).shape
});

export type PluginManifestBaseType = z.infer<typeof PluginManifestBaseSchema>;

export const ToolManifestSchema = z.object({
  ...PluginManifestBaseSchema.shape,
  type: z.literal(PluginTypeEnum.tool),
  toolDescription: z.string(), // 编译时自动补

  inputSchema: z.any().optional(),
  outputSchema: z.any().optional(),
  secretSchema: z.any(), // 总是存在，

  children: z
    .array(
      z.object({
        id: z.string(),
        description: I18nStringSchema,
        name: I18nStringSchema,
        toolDescription: z.string(), // 编译时自动补
        icon: z.string(), // 必须提供 / 自动生成
        inputSchema: z.any(),
        outputSchema: z.any()
      })
    )
    .min(1)
    .optional()
});

export type ToolManifestType = z.infer<typeof ToolManifestSchema>;

export type PluginManifestType = PluginManifestBaseType | ToolManifestType; // TODO: add more types
