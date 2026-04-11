import { I18nStringSchema } from '@fastgpt-plugin/domain/value-objects/i18n-string.vo';
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
