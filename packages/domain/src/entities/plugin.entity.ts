import z from 'zod';
import { I18nStringSchema } from '../value-objects/i18n-string.vo';
import { PluginSourceSchema } from '@fastgpt-plugin/helpers/plugins/type';

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

export const PluginTypeSchema = z.enum([
  'tool',
  'model',
  'workflow',
  /** unimplemented */
  'dataset'
]);

export type PluginTypeType = z.infer<typeof PluginTypeSchema>;

export const PluginTypeEnum = PluginTypeSchema.enum;

export const PluginSchema = z.object({
  pluginId: z.string(),
  version: z.string(),
  etag: z.string(),

  type: PluginTypeSchema,
  source: PluginSourceSchema,

  author: z.string().optional(),
  name: I18nStringSchema,
  icon: z.string(),
  tutorialUrl: z.url().optional(),
  readmeUrl: z.url().optional(),
  description: I18nStringSchema.optional(),
  tags: z.array(PluginTagSchema).optional(),
  versionDescription: I18nStringSchema.optional()
});

export type PluginType = z.output<typeof PluginSchema>;
