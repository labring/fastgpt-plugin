import { z } from '@hono/zod-openapi';

import { PluginTagSchema, PluginTypeSchema } from '@domain/entities/plugin.entity';
import { I18nStringSchema, I18nStringStrictSchema } from '@domain/value-objects/i18n-string.vo';

import { I18nStringDTOSchema } from './common.dto';

const arrayQueryParam = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => {
    if (value == null) {
      return undefined;
    }

    return Array.isArray(value) ? value : [value];
  }, z.array(schema).optional());

export const PluginDTOSchema = z.object({
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

export const PluginListDTOSchema = z.array(PluginDTOSchema).openapi({
  description: 'Plugin list'
});

export const PluginUploadParamsSchema = z
  .object({
    file: z.file().openapi({
      description: 'Plugin zip file',
      example: 'example.pkg'
    })
  })
  .openapi({
    description: 'Plugin upload parameters',
    example: {
      file: 'example.pkg'
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

export const PluginPruneDisabledResponseDTOSchema = z.object({
  count: z.number().int().nonnegative().openapi({
    description: 'Number of disabled plugins removed',
    example: 2
  }),
  plugins: z.array(PluginUniqueIdDTOSchema).openapi({
    description: 'Removed disabled plugin unique ids'
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
  })
});

export const PluginTagListDTOSchema = z
  .array(z.record(z.string(), I18nStringStrictSchema))
  .openapi({
    description: 'Plugin tag list'
  });

export const PluginRuntimeConfigSchema = z.object({}).catchall(z.unknown()).openapi({
  description: 'Plugin runtime config'
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

export type PluginDTOType = z.infer<typeof PluginDTOSchema>;
export type PluginListDTOType = z.infer<typeof PluginListDTOSchema>;
export type PluginUniqueIdDTOType = z.infer<typeof PluginUniqueIdDTOSchema>;
export type PluginPruneDisabledResponseDTOType = z.infer<typeof PluginPruneDisabledResponseDTOSchema>;
export type PluginInstallFailureDTOType = z.infer<typeof PluginInstallFailureDTOSchema>;
export type PluginInstallRequestDTOType = z.infer<typeof PluginInstallDTOSchema.request>;
export type PluginInstallResponseDTOType = z.infer<typeof PluginInstallDTOSchema.response>;
export type PluginListParamsDTOType = z.infer<typeof PluginListParamsSchema>;
export type PluginTagListDTOType = z.infer<typeof PluginTagListDTOSchema>;
export type PluginRuntimeConfigDTOType = z.infer<typeof PluginRuntimeConfigSchema>;
export type PluginRuntimeConfigGetParamsDTOType = z.infer<
  typeof PluginRuntimeConfigGetParamsSchema
>;
export type PluginRuntimeConfigSetParamsDTOType = z.infer<
  typeof PluginRuntimeConfigSetParamsSchema
>;
