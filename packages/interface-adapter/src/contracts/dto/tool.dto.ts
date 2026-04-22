import { z } from '@hono/zod-openapi';

import { SystemVarSchema } from '@domain/value-objects/system-var.vo';

export const SystemVarDTOSchema = z
  .object({
    ...SystemVarSchema.shape
  })
  .openapi({
    description: 'System variables provided to the tool when it is run',
    example: {
      user: {
        id: 'example-user-tmbId',
        username: 'example-user',
        contact: 'example-user@example.com',
        membername: 'example-user',
        teamName: 'example-team',
        teamId: 'example-team-id',
        name: 'example-user'
      },
      app: {
        id: 'example-app-id',
        name: 'example-app'
      },
      tool: {
        id: 'example-tool-id',
        version: '1.0.0',
        prefix: 'example-prefix'
      },
      time: 'example-time'
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
    .record(z.string(), z.string())
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
