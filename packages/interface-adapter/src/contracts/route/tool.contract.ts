import z from 'zod';

import { I18nStringSchema } from '@domain/value-objects/i18n-string.vo';

import { defineContract, jsonResponse } from '../contract.type';
import {
  ToolDetailDTOSchema,
  ToolGetParamsDTOSchema,
  ToolListDTOSchema,
  ToolListParamsDTOSchema,
  ToolRunInputDTOSchema
} from '../dto/tool.dto';

import { authToken } from './auth';

export const ToolContract = {
  Get: defineContract({
    meta: {
      method: 'get',
      path: '/tool',
      operationId: 'tool.get',
      description: 'Get a tool by pluginId, version and source',
      summary: 'Get tool detail',
      tags: ['plugin', 'tool'],
      security: authToken
    },
    request: ToolGetParamsDTOSchema,
    response: {
      200: jsonResponse({ data: ToolDetailDTOSchema }),
      404: jsonResponse({ error: I18nStringSchema })
    }
  }),
  List: defineContract({
    meta: {
      method: 'get',
      path: '/tools',
      operationId: 'tool.list',
      description: 'List tools with optional filters',
      summary: 'List tools',
      tags: ['plugin', 'tool'],
      security: authToken
    },
    request: ToolListParamsDTOSchema,
    response: {
      200: jsonResponse({ data: ToolListDTOSchema }),
      500: jsonResponse({ error: I18nStringSchema })
    }
  }),
  RunStream: defineContract({
    meta: {
      method: 'post',
      path: '/tool/runStream',
      operationId: 'tool.runStream',
      description: 'Run a tool and return stream messages',
      summary: 'Run tool stream',
      tags: ['plugin', 'tool'],
      security: authToken
    },
    request: ToolRunInputDTOSchema,
    response: {
      200: z.object({
        type: z.string()
      }),
      400: jsonResponse({
        error: I18nStringSchema
      })
    }
  })
} as const;

export const ToolRunContract = ToolContract.RunStream;
