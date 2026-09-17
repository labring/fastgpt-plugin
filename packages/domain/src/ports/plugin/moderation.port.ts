import z from 'zod';

import { ModerationSchema } from '../../entities/moderation.entity';
import {
  ModerationCheckResultSchema,
  type ModerationCheckRunInputType
} from '../../value-objects/moderation.vo';
import { PluginSourceSchema, UserPluginIdSchema } from '../../value-objects/plugin.vo';
import type { Result } from '../../value-objects/result.vo';

export const ModerationDetailSchema = z.object({
  ...ModerationSchema.shape,
  source: PluginSourceSchema,
  isLatestVersion: z.boolean()
});

export type ModerationDetailType = z.infer<typeof ModerationDetailSchema>;

export const ModerationDetailInputSchema = UserPluginIdSchema.extend({
  fallbackLatestVersion: z.boolean().optional()
});

export type ModerationDetailInputType = z.infer<typeof ModerationDetailInputSchema>;

export interface ModerationManagerPort {
  detail(arg0: ModerationDetailInputType): Promise<Result<ModerationDetailType>>;
  check(
    arg0: ModerationCheckRunInputType
  ): Promise<Result<z.infer<typeof ModerationCheckResultSchema>>>;
}
