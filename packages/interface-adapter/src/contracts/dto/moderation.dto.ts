import { z } from 'zod';

import { ModerationDetailSchema } from '@domain/ports/plugin/moderation.port';
import {
  ModerationCheckInputSchema,
  ModerationCheckResultSchema
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
  /**
   * 直接用领域 schema，不在 DTO 层把 modality 收窄成 z.literal('text')：
   * 收窄会让非文本请求变成一串 zod 校验报错，而不是带
   * `plugin.moderation.modality_not_supported` 的明确错误。
   */
  input: ModerationCheckInputSchema
});

export type ModerationCheckInputDTOType = z.infer<typeof ModerationCheckInputDTOSchema>;

export const ModerationCheckResultDTOSchema = ModerationCheckResultSchema;
export type ModerationCheckResultDTOType = z.infer<typeof ModerationCheckResultDTOSchema>;

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
