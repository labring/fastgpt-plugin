import { z } from '@hono/zod-openapi';

import { PluginTagSchema, PluginTypeSchema } from '@domain/entities/plugin.entity';
import { I18nStringSchema } from '@domain/value-objects/i18n-string.vo';
import { PluginSourceSchema } from '@domain/value-objects/plugin.vo';

import { I18nStringDTOSchema } from './common.dto';

const arrayQueryParam = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => {
    if (value == null) {
      return undefined;
    }

    return Array.isArray(value) ? value : [value];
  }, z.array(schema).optional());

export const PluginBaseDTOSchema = z.object({
  pluginId: z.string().openapi({
    description: 'Plugin ID',
    example: 'getTime'
  }),
  version: z.string().openapi({
    description: 'Plugin version',
    example: '1.0.0'
  }),
  etag: z.string().openapi({
    description: 'Plugin etag',
    example: 'a1d809f6'
  }),
  type: z.string().openapi({
    description: 'Plugin type',
    example: 'tool'
  }),
  author: z.string().optional().openapi({
    description: 'Plugin author',
    example: ''
  }),
  name: I18nStringDTOSchema.openapi({
    description: 'Plugin name',
    example: {
      en: 'Get Time',
      'zh-CN': '获取时间'
    }
  }),
  icon: z.string().openapi({
    description: 'Plugin icon',
    example: 'https://oss.example.com/getTime/icon.svg'
  }),
  tutorialUrl: z.url().optional().openapi({
    description: 'Plugin tutorial URL',
    example: 'https://oss.example.com/getTime/tutorial'
  }),
  readmeUrl: z.url().optional().openapi({
    description: 'Plugin readme URL',
    example: 'https://oss.example.com/getTime/README.md'
  }),
  repoUrl: z.url().optional().openapi({
    description: 'Plugin repository URL',
    example: 'https://git.example.com/example/getTime'
  }),
  permission: z
    .array(z.string())
    .optional()
    .openapi({
      description: 'Plugin permissions',
      example: ['userInfo:read']
    }),
  description: I18nStringDTOSchema.optional().openapi({
    description: 'Plugin description',
    example: {
      en: 'Plugin description',
      'zh-CN': '插件描述'
    }
  }),
  tags: z
    .array(z.string())
    .optional()
    .openapi({
      description: 'Plugin tags',
      example: ['tool']
    }),
  versionDescription: I18nStringSchema.optional().describe('Plugin version description')
});

export const PluginListItemDTOSchema = PluginBaseDTOSchema.omit({
  versionDescription: true,
  permission: true
})
  .extend({
    source: z.string().openapi({
      description: 'Plugin source',
      example: 'system'
    })
  })
  .openapi({
    description: 'Plugin list item'
  });

export const PluginListDTOSchema = z.array(PluginListItemDTOSchema).openapi({
  description: 'Plugin List'
});

export const PluginUploadFailureDTOSchema = z
  .object({
    fileName: z.string().optional().openapi({
      description: 'Failed upload file name',
      example: 'bad.pkg'
    }),
    reason: I18nStringDTOSchema.openapi({
      description: 'Upload failure reason'
    })
  })
  .openapi({
    description: 'Plugin upload failure'
  });

export const PluginUploadResponseDTOSchema = z
  .object({
    plugins: z.array(PluginBaseDTOSchema).openapi({
      description: 'Parsed uploaded plugin list'
    }),
    failed: z.array(PluginUploadFailureDTOSchema).optional().openapi({
      description: 'Failed uploaded plugin files'
    })
  })
  .openapi({
    description: 'Plugin upload response'
  });

export const PluginUploadParamsSchema = z
  .object({
    files: z
      .array(z.file())
      .min(1)
      .openapi({
        description: 'Plugin .pkg files or .zip package collection files',
        example: ['example.pkg']
      })
  })
  .openapi({
    description: 'Plugin upload parameters',
    example: {
      files: ['example.pkg']
    }
  });

export const PluginUniqueIdDTOSchema = z.object({
  pluginId: z.string().openapi({
    description: 'Plugin unique id',
    example: 'getTime'
  }),
  version: z.string().openapi({
    description: 'Plugin version id',
    example: '1.0.0'
  }),
  etag: z.string().openapi({
    description: 'Plugin etag',
    example: '12345678'
  })
});

export const PluginConfirmParamsSchema = z.object({
  uniqueIds: z
    .array(PluginUniqueIdDTOSchema)
    .min(1)
    .openapi({
      description: 'Plugin unique id list',
      example: [
        {
          pluginId: 'getTime',
          version: '1.0.0',
          etag: '12345678'
        }
      ]
    })
});

export const PluginPruneDisabledResponseDTOSchema = z.object({
  count: z.number().int().nonnegative().openapi({
    description: 'Number of disabled plugins removed',
    example: 2
  }),
  plugins: z.array(PluginUniqueIdDTOSchema).openapi({
    description: 'Removed disabled plugin unique ids'
  })
});

export const PluginDeleteParamsSchema = z.object({
  pluginId: z.string().openapi({
    description: 'Plugin ID',
    example: 'getTime'
  }),
  source: z.string().openapi({
    description: 'Plugin source',
    example: 'system'
  }),
  version: z.string().openapi({
    description: 'Plugin version',
    example: '1.0.0'
  })
});

export const PluginInstallFailureDTOSchema = z.object({
  url: z.string(),
  reason: I18nStringSchema
});

export const PluginInstallDTOSchema = {
  request: z.object({
    urls: z.array(z.string()).openapi({
      description: 'Plugin install urls',
      example: [
        'https://oss.example.com/plugin/getTime.pkg',
        'https://oss.example.com/plugin/delay.pkg'
      ]
    })
  }),
  response: z
    .object({
      failed: z.array(PluginInstallFailureDTOSchema).optional()
    })
    .openapi({
      description: 'Plugin install response',
      examples: [
        {},
        {
          failed: [
            {
              url: 'https://oss.example.com/plugin/getTime.pkg',
              reason: {
                en: 'Failed to install plugin',
                'zh-CN': '安装插件失败'
              }
            }
          ]
        }
      ]
    })
};

export const PluginListParamsSchema = z.object({
  types: arrayQueryParam(PluginTypeSchema).openapi({
    description: 'Filter by plugin types',
    example: ['tool']
  }),
  tags: arrayQueryParam(PluginTagSchema).openapi({
    description: 'Filter by plugin tags',
    example: ['tools', 'productivity']
  }),
  op: z.enum(['or', 'and']).optional().openapi({
    description: 'Filter operator for tags and types',
    example: 'or'
  }),
  sources: arrayQueryParam(PluginSourceSchema).openapi({
    description: 'Filter by plugin sources',
    example: ['system', 'market']
  })
});

export const PluginVersionItemDTOSchema = z.object({
  version: z.string().openapi({
    description: 'Plugin version',
    example: '1.0.0'
  }),
  versionDescription: I18nStringDTOSchema.optional().openapi({
    description: 'Plugin version description',
    example: {
      en: 'Initial stable release',
      'zh-CN': '首个稳定版本'
    }
  })
});

export const PluginVersionListDTOSchema = z.array(PluginVersionItemDTOSchema).openapi({
  description: 'Plugin version list'
});

export const PluginVersionListParamsSchema = z.object({
  pluginId: z.string().openapi({
    description: 'Plugin ID',
    example: 'getTime'
  }),
  source: z.string().openapi({
    description: 'Plugin source',
    example: 'system'
  })
});

export const PluginTagListDTOSchema = z
  .array(
    z.object({
      id: z.string().openapi({
        description: 'Plugin tag ID',
        example: 'tools'
      }),
      name: I18nStringDTOSchema.openapi({
        description: 'Plugin tag name',
        example: {
          en: 'Tools',
          'zh-CN': '工具'
        }
      })
    })
  )
  .openapi({
    description: 'Plugin tag list'
  });

export const PluginRuntimeConfigSchema = z
  .object({
    minPods: z.number().int().nonnegative().openapi({
      description: 'Minimum pods kept warm for one plugin',
      example: 0
    }),
    maxPods: z.number().int().positive().openapi({
      description: 'Maximum pods allowed for one plugin',
      example: 5
    }),
    podTimeout: z.number().int().positive().openapi({
      description: 'Plugin pod request timeout in milliseconds',
      example: 120000
    }),
    maxConcurrentRequestsPerPod: z.number().int().positive().openapi({
      description: 'Maximum concurrent requests per pod',
      example: 10
    })
  })
  .strict()
  .refine((config) => config.minPods <= config.maxPods, {
    message: 'minPods cannot be greater than maxPods',
    path: ['minPods']
  })
  .openapi({
    description: 'Plugin runtime config. Global local-pool settings are configured by env only.',
    example: {
      minPods: 0,
      maxPods: 5,
      podTimeout: 120000,
      maxConcurrentRequestsPerPod: 10
    }
  });

export const PluginRuntimeConfigGetParamsSchema = z.object({
  pluginId: z.string().openapi({
    description: 'Plugin ID',
    example: 'getTime'
  })
});

export const PluginRuntimeConfigSetParamsSchema = z.object({
  pluginId: z.string().openapi({
    description: 'Plugin ID',
    example: 'getTime'
  }),
  config: PluginRuntimeConfigSchema
});

export const PluginRuntimeConfigResetParamsSchema = z.object({
  pluginId: z.string().openapi({
    description: 'Plugin ID',
    example: 'getTime'
  })
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
