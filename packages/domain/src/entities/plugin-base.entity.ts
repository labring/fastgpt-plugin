import z from 'zod';

import { PluginPermissionEnumSchema } from '@domain/value-objects/permission.vo';

import { I18nStringSchema } from '../value-objects/i18n-string.vo';
import { PluginSourceSchema } from '../value-objects/plugin.vo';

export const PluginTagSchema = z.enum([
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

export const PluginTagEnum = PluginTagSchema.enum;

export type PluginTagType = z.infer<typeof PluginTagSchema>;

export const PluginTypeSchema = z.enum([
  'tool'
  /** unimplemented */
  // 'model',
  // 'workflow',
  // 'dataset'
]);

export type PluginTypeType = z.infer<typeof PluginTypeSchema>;

export const PluginTypeEnum = PluginTypeSchema.enum;

export const PluginStatusEnumSchema = z.enum(['active', 'pending', 'disabled']);
export const PluginStatusEnum = PluginStatusEnumSchema.enum;
export type PluginStatusEnumType = z.infer<typeof PluginStatusEnumSchema>;

export const PluginBaseSchema = z.object({
  pluginId: z.string(),
  version: z.string(),
  etag: z.string(),

  type: PluginTypeSchema,

  author: z.string().optional(),
  repoUrl: z.string().optional(), // github 仓库地址
  name: I18nStringSchema,
  icon: z.string(),
  tutorialUrl: z.url().optional(),
  readmeUrl: z.url().optional(),
  description: I18nStringSchema,
  tags: z.array(PluginTagSchema).optional(),
  versionDescription: I18nStringSchema.optional(),
  permission: z.array(PluginPermissionEnumSchema).optional()
});

export type PluginBaseType = z.output<typeof PluginBaseSchema>;
