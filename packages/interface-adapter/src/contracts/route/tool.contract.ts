import z from 'zod';

import { I18nStringSchema } from '@domain/value-objects/i18n-string.vo';
import { ToolAnswerSchema } from '@domain/value-objects/tool.vo';

import { defineContract, defineResponse, jsonBody } from '../contract.type';
import { PluginUniqueIdDTOSchema } from '../dto/plugin.dto';
import { SystemVarDTOSchema } from '../dto/tool.dto';

import { authToken } from './auth';

export const ToolRunContract = defineContract({
  method: 'POST',
  path: '/tool/run',
  operationId: 'tool.run',
  description: 'Run a tool',
  summary: 'Run a tool',
  tags: ['plugin', 'tool'],
  request: {
    body: jsonBody(
      z.object({
        uniqueId: PluginUniqueIdDTOSchema,
        systemVar: SystemVarDTOSchema,
        input: z.record(z.string(), z.unknown()).describe('Tool input parameters, key-value pairs')
      })
    )
  },
  response: {
    200: defineResponse({
      body: {
        'text/event-stream': ToolAnswerSchema
      }
    }),
    400: defineResponse({
      body: jsonBody(
        z.object({
          error: I18nStringSchema
        })
      )
    })
  },
  security: authToken
});
