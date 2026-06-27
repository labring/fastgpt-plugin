import { z } from 'zod';

import { type ContractMetaType,defineContract, jsonResponse } from '../contract.type';
import { ErrorResponseDTOSchema } from '../dto/common.dto';
import {
  ConnectionGatewayMetricsDTOSchema,
  ConnectionGatewayRequestAcceptedDTOSchema,
  ConnectionGatewayRequestDTOSchema,
  ConnectionGatewaySessionStatusViewDTOSchema
} from '../dto/connection-gateway.dto';

const tags = ['connection-gateway'] satisfies ContractMetaType['tags'];

export const ConnectionGatewayContract = {
  Metrics: defineContract({
    meta: {
      method: 'get',
      path: '/metrics',
      operationId: 'connectionGateway.metrics',
      summary: 'Connection Gateway metrics',
      tags
    },
    response: {
      200: jsonResponse({ data: ConnectionGatewayMetricsDTOSchema }),
      500: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  }),
  SessionStatus: defineContract({
    meta: {
      method: 'get',
      path: '/internal/sessions/{sessionId}/status',
      operationId: 'connectionGateway.sessionStatus',
      summary: 'Get a gateway session status',
      tags
    },
    request: z.object({
      sessionId: z.string().min(1)
    }),
    response: {
      200: jsonResponse({ data: ConnectionGatewaySessionStatusViewDTOSchema }),
      404: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  }),
  PublishRequest: defineContract({
    meta: {
      method: 'post',
      path: '/internal/sessions/{sessionId}/requests',
      operationId: 'connectionGateway.publishRequest',
      summary: 'Publish an opaque request envelope to a gateway session mailbox',
      tags
    },
    request: z.object({
      sessionId: z.string().min(1),
      body: ConnectionGatewayRequestDTOSchema
    }),
    response: {
      202: jsonResponse({ data: ConnectionGatewayRequestAcceptedDTOSchema }),
      400: jsonResponse({ error: ErrorResponseDTOSchema }),
      404: jsonResponse({ error: ErrorResponseDTOSchema }),
      409: jsonResponse({ error: ErrorResponseDTOSchema }),
      429: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  }),
  DeleteSession: defineContract({
    meta: {
      method: 'delete',
      path: '/internal/sessions/{sessionId}',
      operationId: 'connectionGateway.deleteSession',
      summary: 'Delete a gateway session',
      tags
    },
    request: z.object({
      sessionId: z.string().min(1)
    }),
    response: {
      200: jsonResponse({ data: z.object({ deleted: z.boolean() }) })
    }
  })
};
