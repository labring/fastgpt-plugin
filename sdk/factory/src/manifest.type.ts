import z from 'zod';

import { ToolDescriptionSchema } from '@domain/entities/tool.entity';
import { ToolManifestSchema } from '@domain/value-objects/plugin/plugin-manifest.vo';

export const UserToolManifestSchema = z.object({
  ...ToolManifestSchema.omit({
    inputSchema: true,
    outputSchema: true,
    secretSchema: true,
    type: true,
    children: true
  }).shape,
  toolDescription: ToolDescriptionSchema.optional(),
  // children: z
  //   .array(
  //     z.object({
  //       id: z.string(),
  //       description: I18nStringSchema,
  //       name: I18nStringSchema,
  //       icon: z.string().optional(),
  //       toolDescription: ToolDescriptionSchema.optional()
  //     })
  //   )
  //   .min(1)
  //   .optional()
  icon: z.string().optional()
});

export type UserToolManifestType = z.infer<typeof UserToolManifestSchema>;

export const defineToolManifest = <T extends UserToolManifestType>(manifest: T) => {
  return UserToolManifestSchema.parse({ ...manifest, type: 'tool' });
};
