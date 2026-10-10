import { z } from 'zod';

import { ModerationDetailSchema } from '@domain/ports/plugin/moderation.port';
import {
  ModerationCheckInputSchema,
  ModerationResultSchema
} from '@domain/value-objects/moderation.vo';

import {
  booleanQueryParam,
  PluginSourceDTOSchema,
  SystemVarDTOSchema
} from './common.dto';

export const ModerationCheckInputDTOSchema = z.object({
  pluginId: z.string(),
  version: z.string().optional(),
  source: PluginSourceDTOSchema.optional(),
  secrets: z.record(z.string(), z.unknown()).optional(),
  systemVar: SystemVarDTOSchema,
  input: ModerationCheckInputSchema
}).strict();

export type ModerationCheckInputDTOType = z.infer<typeof ModerationCheckInputDTOSchema>;

export const ModerationResultDTOSchema = ModerationResultSchema;
export type ModerationResultDTOType = z.infer<typeof ModerationResultDTOSchema>;

export const ModerationDetailDTOSchema = z.object({
  ...ModerationDetailSchema.shape
});

export type ModerationDetailDTOType = z.infer<typeof ModerationDetailDTOSchema>;

export const ModerationGetParamsDTOSchema = z.object({
  pluginId: z.string(),
  version: z.string().optional(),
  source: PluginSourceDTOSchema.optional(),
  fallbackLatestVersion: booleanQueryParam(z.boolean()).optional()
});

export type ModerationGetParamsDTOType = z.infer<typeof ModerationGetParamsDTOSchema>;
