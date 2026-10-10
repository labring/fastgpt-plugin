import z from 'zod';

import {
  PluginManifestBaseSchema,
  ToolManifestSchema
} from '@domain/value-objects/plugin/plugin-manifest.vo';

export const UserToolManifestSchema = z.object({
  ...ToolManifestSchema.omit({
    inputSchema: true,
    outputSchema: true,
    secretSchema: true,
    type: true,
    children: true
  }).shape,
  toolDescription: z.string().optional(),
  // children: z
  //   .array(
  //     z.object({
  //       id: z.string(),
  //       description: I18nStringSchema,
  //       name: I18nStringSchema,
  //       icon: z.string().optional(),
  //       toolDescription: z.string().optional()
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

export const UserModerationMetaSchema = z.object({
  provider: z.string().min(1),
  docUrl: z.string().optional()
}).strict();

export type UserModerationMetaType = z.infer<typeof UserModerationMetaSchema>;

// 从 PluginManifestBaseSchema 派生，而不是从 UserToolManifestSchema 派生：
// moderation 没有面向模型的 toolDescription / inputSchema / outputSchema / children 语义。
export const UserModerationManifestSchema = z.object({
  ...PluginManifestBaseSchema.omit({ type: true }).shape,
  meta: UserModerationMetaSchema,
  icon: z.string().optional()
});

export type UserModerationManifestType = z.infer<typeof UserModerationManifestSchema>;

export const defineModerationManifest = <T extends UserModerationManifestType>(manifest: T) => {
  return UserModerationManifestSchema.parse({ ...manifest, type: 'moderation' });
};
