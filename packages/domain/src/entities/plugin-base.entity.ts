import z from 'zod';

import { PluginPermissionEnumSchema } from '@domain/value-objects/permission.vo';

import { I18nLangSchema, TolerantI18nStringSchema } from '../value-objects/i18n-string.vo';

const rawPluginTagSchema = z.enum([
  'tools',
  'search',
  'multimodal',
  'communication',
  'finance',
  'design',
  'productivity',
  'news',
  'entertainment',
  'social',
  'scientific',
  'other'
]);

export const PluginTagEnum = rawPluginTagSchema.enum;
export const PluginTagSchema = rawPluginTagSchema.catch(PluginTagEnum.other);
export type PluginTagType = z.infer<typeof PluginTagSchema>;

const rawPluginTypeSchema = z.enum([
  'tool',
  'unknown'
  /** unimplemented */
  // 'model',
  // 'workflow',
  // 'dataset'
]);

export const PluginTypeEnum = rawPluginTypeSchema.enum;
export const PluginTypeSchema = rawPluginTypeSchema.catch(PluginTypeEnum.unknown);
export type PluginTypeType = z.infer<typeof PluginTypeSchema>;

const rawPluginStatusEnumSchema = z.enum(['active', 'pending', 'disabled', 'unknown']);
export const PluginStatusEnum = rawPluginStatusEnumSchema.enum;
export const PluginStatusEnumSchema = rawPluginStatusEnumSchema.catch(PluginStatusEnum.unknown);
export type PluginStatusEnumType = z.infer<typeof PluginStatusEnumSchema>;

export const PluginBaseSchema = z.object({
  pluginId: z.string(),
  version: z.string(),
  etag: z.string(),

  type: PluginTypeSchema,

  author: z.string().optional(),
  repoUrl: z.string().optional(), // github 仓库地址
  name: TolerantI18nStringSchema,
  icon: z.string(),
  tutorialUrl: z.url().optional(),
  readmeUrl: z.url().optional(),
  readmeUrls: z.partialRecord(I18nLangSchema, z.url()).optional(),
  description: TolerantI18nStringSchema,
  toolDescription: z.unknown().optional(), // Legacy field retained for compatibility.
  tags: z.array(PluginTagSchema).optional(),
  versionDescription: TolerantI18nStringSchema.optional(),
  permission: z.array(PluginPermissionEnumSchema).optional()
});

export type PluginBaseType = z.output<typeof PluginBaseSchema>;
