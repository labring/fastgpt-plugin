import { defineContract, jsonResponse } from '../contract.type';
import { ErrorResponseDTOSchema } from '../dto/common.dto';
import { PluginServiceFeaturesDTOSchema } from '../dto/plugin-service-feature.dto';

import { authToken } from './auth';

export const PluginServiceFeatureContract = {
  Get: defineContract({
    meta: {
      method: 'get',
      path: '/plugin/features',
      operationId: 'plugin.features',
      description: 'Get enabled Plugin service features',
      summary: 'Get Plugin service features',
      tags: ['plugin'],
      security: authToken
    },
    response: {
      200: jsonResponse({ data: PluginServiceFeaturesDTOSchema }),
      500: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  })
} as const;
