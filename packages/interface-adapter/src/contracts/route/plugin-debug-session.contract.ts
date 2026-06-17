import { type ContractMetaType,defineContract, jsonResponse } from '../contract.type';
import { ErrorResponseDTOSchema } from '../dto/common.dto';
import {
  PluginDebugSessionCreateRequestDTOSchema,
  PluginDebugSessionCreateResponseDTOSchema,
  PluginDebugSessionRevokeRequestDTOSchema,
  PluginDebugSessionRevokeResponseDTOSchema,
  PluginDebugSessionStatusResponseDTOSchema,
  PluginDebugSessionTicketExchangeRequestDTOSchema,
  PluginDebugSessionTicketExchangeResponseDTOSchema
} from '../dto/plugin-debug-session.dto';

import { authToken } from './auth';

const tags = ['plugin'] satisfies ContractMetaType['tags'];

export const PluginDebugSessionContract = {
  Create: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/debug-sessions',
      operationId: 'pluginDebugSession.create',
      description: 'Create a plugin debug session for a FastGPT tmbId',
      summary: 'Create debug session',
      tags,
      security: authToken
    },
    request: PluginDebugSessionCreateRequestDTOSchema,
    response: {
      200: jsonResponse({ data: PluginDebugSessionCreateResponseDTOSchema }),
      400: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  }),
  ExchangeTicket: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/debug-sessions/tickets:exchange',
      operationId: 'pluginDebugSession.exchangeTicket',
      description: 'Exchange a reusable debug connect key for scoped gateway connection info',
      summary: 'Exchange debug connect key',
      tags,
      security: authToken
    },
    request: PluginDebugSessionTicketExchangeRequestDTOSchema,
    response: {
      200: jsonResponse({ data: PluginDebugSessionTicketExchangeResponseDTOSchema }),
      400: jsonResponse({ error: ErrorResponseDTOSchema }),
      404: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  }),
  Status: defineContract({
    meta: {
      method: 'get',
      path: '/plugin/debug-sessions/:debugSessionId',
      operationId: 'pluginDebugSession.status',
      description: 'Get a plugin debug session status and mounted debug plugins',
      summary: 'Get debug session status',
      tags,
      security: authToken
    },
    response: {
      200: jsonResponse({ data: PluginDebugSessionStatusResponseDTOSchema }),
      404: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  }),
  Revoke: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/debug-sessions/:debugSessionId/revoke',
      operationId: 'pluginDebugSession.revoke',
      description: 'Revoke a plugin debug session and close its gateway session',
      summary: 'Revoke debug session',
      tags,
      security: authToken
    },
    request: PluginDebugSessionRevokeRequestDTOSchema,
    response: {
      200: jsonResponse({ data: PluginDebugSessionRevokeResponseDTOSchema }),
      404: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  })
} as const;
