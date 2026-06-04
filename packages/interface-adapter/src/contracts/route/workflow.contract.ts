import { defineContract, jsonResponse } from '../contract.type';
import { ErrorResponseDTOSchema } from '../dto/common.dto';
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
      500: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  })
} as const;
