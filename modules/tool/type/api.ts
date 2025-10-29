import { I18nStringStrictSchema } from '@/type/i18n';
import { z } from 'zod';
import { ToolSchema, VersionListItemSchema } from './tool';

export const ToolTagListSchema = z.array(
  z.object({
    type: z.string(),
    name: I18nStringStrictSchema
  })
);

export const ToolDetailSchema = ToolSchema.omit({
  isWorkerRun: true,
  cb: true,
  toolFilename: true,
  versionList: true
}).merge(
  z.object({
    versionList: z.array(VersionListItemSchema).optional()
  })
);

export const ToolSimpleSchema = ToolDetailSchema.omit({
  secretInputConfig: true,
  toolDescription: true,
  versionList: true
});

export type ToolDetailType = z.infer<typeof ToolDetailSchema>;
export type ToolSimpleType = z.infer<typeof ToolSimpleSchema>;
