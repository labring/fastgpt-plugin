import { z } from 'zod';

import { I18nStringDTOSchema } from './common.dto';

const PluginSourceDTOSchema = z.string();
const PluginTagDTOSchema = z.enum([
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
const PluginTypeDTOSchema = z.enum(['tool']);

const arrayQueryParam = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => {
    if (value == null) {
      return undefined;
    }

    return Array.isArray(value) ? value : [value];
  }, z.array(schema).optional());

export const PluginBaseDTOSchema = z.object({
  pluginId: z.string(),
  version: z.string(),
  etag: z.string(),
  type: z.string(),
  author: z.string().optional(),
  name: I18nStringDTOSchema,
  icon: z.string(),
  tutorialUrl: z.url().optional(),
  readmeUrl: z.url().optional(),
  repoUrl: z.url().optional(),
  permission: z.array(z.string()).optional(),
  description: I18nStringDTOSchema.optional(),
  tags: z.array(z.string()).optional(),
  versionDescription: I18nStringDTOSchema.describe('Plugin version description').optional()
});

export const PluginListItemDTOSchema = PluginBaseDTOSchema.omit({
  versionDescription: true,
  permission: true
}).extend({
  source: z.string()
});

export const PluginListDTOSchema = z.array(PluginListItemDTOSchema);

export const PluginUploadFailureDTOSchema = z
  .object({
    fileName: z.string().optional(),
    reason: I18nStringDTOSchema
  });

export const PluginUploadResponseDTOSchema = z
  .object({
    plugins: z.array(PluginBaseDTOSchema),
    failed: z.array(PluginUploadFailureDTOSchema).optional()
  });

export const PluginUploadParamsSchema = z
  .object({
    files: z.array(z.file()).min(1)
  });

export const PluginUniqueIdDTOSchema = z.object({
  pluginId: z.string(),
  version: z.string(),
  etag: z.string()
});

export const PluginConfirmParamsSchema = z.object({
  uniqueIds: z.array(PluginUniqueIdDTOSchema).min(1)
});

export const PluginPruneDisabledResponseDTOSchema = z.object({
  count: z.number().int().nonnegative(),
  plugins: z.array(PluginUniqueIdDTOSchema)
});

export const PluginDeleteParamsSchema = z.object({
  pluginId: z.string(),
  source: z.string(),
  version: z.string()
});

export const PluginInstallFailureDTOSchema = z.object({
  url: z.string(),
  reason: I18nStringDTOSchema
});

export const PluginInstallDTOSchema = {
  request: z.object({
    urls: z.array(z.string())
  }),
  response: z.object({
    failed: z.array(PluginInstallFailureDTOSchema).optional()
  })
};

export const PluginListParamsSchema = z.object({
  types: arrayQueryParam(PluginTypeDTOSchema),
  tags: arrayQueryParam(PluginTagDTOSchema),
  op: z.enum(['or', 'and']).optional(),
  sources: arrayQueryParam(PluginSourceDTOSchema)
});

export const PluginVersionItemDTOSchema = z.object({
  version: z.string(),
  versionDescription: I18nStringDTOSchema.optional()
});

export const PluginVersionListDTOSchema = z.array(PluginVersionItemDTOSchema);

export const PluginVersionListParamsSchema = z.object({
  pluginId: z.string(),
  source: z.string()
});

export const PluginTagListDTOSchema = z
  .array(
    z.object({
      id: z.string(),
      name: I18nStringDTOSchema
    })
  );

const PluginRuntimeConfigObjectSchema = z
  .object({
    minPods: z.number().int().nonnegative(),
    maxPods: z.number().int().positive(),
    podTimeout: z.number().int().positive(),
    maxConcurrentRequestsPerPod: z.number().int().positive()
  });

export const PluginRuntimeConfigSchema = PluginRuntimeConfigObjectSchema
  .strict()
  .refine((config) => config.minPods <= config.maxPods, {
    message: 'minPods cannot be greater than maxPods',
    path: ['minPods']
  });

export const PluginRuntimeConfigGetParamsSchema = z.object({
  pluginId: z.string()
});

export const PluginRuntimeConfigSetParamsSchema = z.object({
  pluginId: z.string(),
  config: PluginRuntimeConfigSchema
});

export const PluginRuntimeConfigResetParamsSchema = z.object({
  pluginId: z.string()
});

export type PluginDTOType = z.infer<typeof PluginBaseDTOSchema>;
export type PluginUploadFailureDTOType = z.infer<typeof PluginUploadFailureDTOSchema>;
export type PluginUploadResponseDTOType = z.infer<typeof PluginUploadResponseDTOSchema>;
export type PluginListDTOType = z.infer<typeof PluginListDTOSchema>;
export type PluginListItemDTOType = z.infer<typeof PluginListItemDTOSchema>;
export type PluginUniqueIdDTOType = z.infer<typeof PluginUniqueIdDTOSchema>;
export type PluginConfirmParamsDTOType = z.infer<typeof PluginConfirmParamsSchema>;
export type PluginPruneDisabledResponseDTOType = z.infer<
  typeof PluginPruneDisabledResponseDTOSchema
>;
export type PluginDeleteParamsDTOType = z.infer<typeof PluginDeleteParamsSchema>;
export type PluginInstallFailureDTOType = z.infer<typeof PluginInstallFailureDTOSchema>;
export type PluginInstallRequestDTOType = z.infer<typeof PluginInstallDTOSchema.request>;
export type PluginInstallResponseDTOType = z.infer<typeof PluginInstallDTOSchema.response>;
export type PluginListParamsDTOType = z.infer<typeof PluginListParamsSchema>;
export type PluginVersionItemDTOType = z.infer<typeof PluginVersionItemDTOSchema>;
export type PluginVersionListDTOType = z.infer<typeof PluginVersionListDTOSchema>;
export type PluginVersionListParamsDTOType = z.infer<typeof PluginVersionListParamsSchema>;
export type PluginTagListDTOType = z.infer<typeof PluginTagListDTOSchema>;
export type PluginRuntimeConfigDTOType = z.infer<typeof PluginRuntimeConfigSchema>;
export type PluginRuntimeConfigGetParamsDTOType = z.infer<
  typeof PluginRuntimeConfigGetParamsSchema
>;
export type PluginRuntimeConfigSetParamsDTOType = z.infer<
  typeof PluginRuntimeConfigSetParamsSchema
>;
export type PluginRuntimeConfigResetParamsDTOType = z.infer<
  typeof PluginRuntimeConfigResetParamsSchema
>;
