import { defineContract, jsonResponse } from '../contract.type';
import { ErrorResponseDTOSchema } from '../dto/common.dto';
import {
  ModerationCheckInputDTOSchema,
  ModerationDetailDTOSchema,
  ModerationGetParamsDTOSchema,
  ModerationResultDTOSchema
} from '../dto/moderation.dto';

import { authToken } from './auth';

export const ModerationContract = {
  Get: defineContract({
    meta: {
      method: 'get',
      path: '/moderation',
      operationId: 'moderation.get',
      description: 'Get a moderation plugin by pluginId, version and source',
      summary: 'Get moderation plugin detail',
      tags: ['moderation'],
      security: authToken
    },
    request: ModerationGetParamsDTOSchema,
    response: {
      200: jsonResponse({ data: ModerationDetailDTOSchema }),
      404: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  }),
  Check: defineContract({
    meta: {
      method: 'post',
      path: '/moderation/check',
      operationId: 'moderation.check',
      description: 'Check content with a moderation plugin',
      summary: 'Check content with the moderation plugin',
      tags: ['moderation'],
      security: authToken
    },
    request: ModerationCheckInputDTOSchema,
    response: {
      200: jsonResponse({ data: ModerationResultDTOSchema }),
      400: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  })
} as const;
