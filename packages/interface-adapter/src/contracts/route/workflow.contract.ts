import { I18nStringSchema } from '@domain/value-objects/i18n-string.vo';

import { defineContract, jsonResponse } from '../contract.type';
import { WorkflowListDTOSchema } from '../dto/workflow.dto';

import { authToken } from './auth';

export const WorkflowContract = {
  List: defineContract({
    meta: {
      method: 'get',
      path: '/list',
      operationId: 'workflow.list',
      description: 'Get a list of all available workflow templates',
      summary: 'List workflow templates',
      tags: ['workflow'],
      security: authToken
    },
    response: {
      200: jsonResponse({ data: WorkflowListDTOSchema }),
      500: jsonResponse({ error: I18nStringSchema })
    }
  })
} as const;
