import { z } from '@hono/zod-openapi';

import { PluginTagSchema } from '@domain/entities/plugin.entity';
import {
  ToolDetailSchema,
  ToolListChildItemSchema,
  ToolListItemSchema
} from '@domain/ports/plugin/tool.port';
import { PluginSourceSchema } from '@domain/value-objects/plugin.vo';
import { SystemVarSchema } from '@domain/value-objects/system-var.vo';

const arrayQueryParam = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => {
    if (value == null) {
      return undefined;
    }

    return Array.isArray(value) ? value : [value];
  }, z.array(schema).optional());

export const SystemVarDTOSchema = z
  .object({
    ...SystemVarSchema.shape
  })
  .openapi({
    description: 'System variables provided to the tool when it is run',
    example: {
      time: 'example-time',
      app: {
        id: 'example-id',
        name: 'example-name'
      },
      chat: {
        chatId: 'example-chat-id',
        uId: 'example-u-id'
      },
      invokeToken: 'example-invoke-token'
    }
  })
  .openapi('SystemVar');

export const ToolRunInputDTOSchema = z.object({
  pluginId: z.string().openapi({
    description: 'Plugin ID',
    example: 'getTime'
  }),
  version: z.string().optional().openapi({
    description: 'Plugin version, optional. Empty or missing means latest version',
    example: '1.0.0'
  }),
  source: z.string().optional().openapi({
    description: 'Plugin source, optional, default is "system"',
    example: 'system'
  }),
  secrets: z
    .record(z.string(), z.any())
    .optional()
    .openapi({
      description: 'Tool secrets, key-value pairs',
      example: {
        secretKey1: 'secretValue1',
        secretKey2: 'secretValue2'
      }
    }),
  systemVar: SystemVarDTOSchema,
  input: z.record(z.string(), z.unknown()).openapi({
    description: 'Tool input parameters, key-value pairs',
    example: {
      param1: 'value1',
      param2: 123,
      param3: {
        subParam1: 'subValue1'
      }
    }
  }),
  childId: z.string().optional().openapi({
    description: 'Child tool ID, only exists when the tool is part of a toolset',
    example: 'example-child-tool-id'
  })
});

export type ToolRunInputDTOType = z.infer<typeof ToolRunInputDTOSchema>;

export const ToolListChildItemDTOSchema = z.object({
  ...ToolListChildItemSchema.shape
});

export type ToolListChildItemDTOType = z.infer<typeof ToolListChildItemDTOSchema>;

export const ToolListItemDTOSchema = z.object({
  ...ToolListItemSchema.shape,
  children: z.array(ToolListChildItemDTOSchema).optional()
});

export type ToolListItemDTOType = z.infer<typeof ToolListItemDTOSchema>;

export const ToolListDTOSchema = z.array(ToolListItemDTOSchema);
export type ToolListDTOType = z.infer<typeof ToolListDTOSchema>;

export const ToolDetailDTOSchema = z.object({
  ...ToolDetailSchema.shape
});

export type ToolDetailDTOType = z.infer<typeof ToolDetailDTOSchema>;

export const ToolGetParamsDTOSchema = z.object({
  pluginId: z.string().openapi({
    description: 'Tool plugin ID',
    example: 'getTime'
  }),
  version: z.string().optional().openapi({
    description: 'Tool version',
    example: '1.0.0'
  }),
  source: PluginSourceSchema.optional().default('system').openapi({
    description: 'Tool source',
    example: 'system'
  })
});

export type ToolGetParamsDTOType = z.infer<typeof ToolGetParamsDTOSchema>;

export const ToolListParamsDTOSchema = z.object({
  tags: arrayQueryParam(PluginTagSchema).openapi({
    description: 'Filter by tool tags',
    example: ['tools']
  }),
  op: z.enum(['or', 'and']).optional().openapi({
    description: 'Filter operator for tags',
    example: 'or'
  }),
  sources: arrayQueryParam(PluginSourceSchema).openapi({
    description: 'Filter by tool sources',
    example: ['system']
  })
});

export type ToolListParamsDTOType = z.infer<typeof ToolListParamsDTOSchema>;
