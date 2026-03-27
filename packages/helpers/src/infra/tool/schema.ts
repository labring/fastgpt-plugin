import { I18nStringSchema } from '@fastgpt-plugin/domain/value-objects/i18n-string.vo';
import { PluginChildSchema } from '@fastgpt-plugin/helpers/plugins/type';
import z from 'zod';

/**
 * 子工具配置 Schema
 */
export const ChildToolManifestSchema = z.object({
  name: I18nStringSchema,
  description: I18nStringSchema,
  toolDescription: z.string().optional(),
  icon: z.string().optional()
});

/**
 * Manifest 配置 Schema - 用于验证 manifest.yaml
 * 统一 tool 和 toolset，通过 children 字段区分
 */
export const ManifestSchema = z
  .object({
    type: z.literal(PluginTypeEnum.tool),
    toolId: z.string(),
    name: I18nStringSchema,
    description: I18nStringSchema,
    toolDescription: z.string().optional(),
    version: z.string(),
    versionDescription: I18nStringSchema.optional(),
    tags: z.array(ToolTagSchema).optional(),
    icon: z.string().optional(),
    author: z.string().optional().default('FastGPT'),
    tutorialUrl: z.url().optional(),
    // 子工具配置：key 为子工具名称，value 为子工具配置
    children: z.record(z.string(), ChildToolManifestSchema).optional()
  })
  .transform((data) => {
    const children = data.children
      ? Object.fromEntries(
          Object.entries(data.children).map(([key, child]) => [
            key,
            {
              ...child,
              toolDescription: child.toolDescription ?? child.description.en ?? ''
            }
          ])
        )
      : {};
    return {
      ...data,
      ...(children ? { children } : {}),
      toolDescription: data.toolDescription ?? data.description.en ?? ''
    };
  });

export type ManifestType = z.infer<typeof ManifestSchema>;

export const ToolConfigJSONSchema = z.object({
  inputSchema: z.any().optional(),
  outputSchema: z.any().optional(),
  secretSchema: z.any().optional(),
  children: z
    .record(
      z.string(),
      z.object({
        inputSchema: z.any().optional(),
        outputSchema: z.any().optional()
      })
    )
    .optional()
});

export type ToolConfigJSONType = z.infer<typeof ToolConfigJSONSchema>;
