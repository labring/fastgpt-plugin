import z from 'zod';

import { PluginBaseSchema } from '@domain/entities/plugin.entity';
import { PluginStatusEnumSchema } from '@domain/entities/plugin-base.entity';

export const PluginRecordDataSchema = z
  .record(z.string(), z.unknown())
  .nullish()
  .transform((value) => value ?? {});

export const PluginRecordSchema = z.object({
  ...PluginBaseSchema.shape,
  data: PluginRecordDataSchema,
  createAt: z.coerce.date().optional(),
  updateAt: z.coerce.date().optional(),
  status: PluginStatusEnumSchema.optional(),
  expiredAt: z.coerce.date().optional()
});

export const PluginRecordPayloadSchema = PluginRecordSchema.omit({
  createAt: true,
  updateAt: true,
  status: true,
  expiredAt: true
});

export type PluginRecordType = z.output<typeof PluginRecordSchema>;
export type PluginRecordPayloadType = z.output<typeof PluginRecordPayloadSchema>;
