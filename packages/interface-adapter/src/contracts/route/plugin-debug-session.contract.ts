import { type ContractMetaType,defineContract, jsonResponse } from '../contract.type';
import { ErrorResponseDTOSchema } from '../dto/common.dto';
import {
  PluginDebugSessionConnectionKeyExchangeRequestDTOSchema,
  PluginDebugSessionConnectionKeyExchangeResponseDTOSchema,
  PluginDebugSessionCreateRequestDTOSchema,
  PluginDebugSessionCreateResponseDTOSchema,
  PluginDebugSessionRevokeRequestDTOSchema,
  PluginDebugSessionRevokeResponseDTOSchema,
  PluginDebugSessionStatusResponseDTOSchema
} from '../dto/plugin-debug-session.dto';

import { authToken } from './auth';

const tags = ['plugin'] satisfies ContractMetaType['tags'];

export const PluginDebugSessionContract = {
  Create: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/debug-sessions',
      operationId: 'pluginDebugSession.create',
      description: 'Enable a tmbId-scoped plugin debug channel',
      summary: 'Enable debug channel',
      tags,
      security: authToken
    },
    request: PluginDebugSessionCreateRequestDTOSchema,
    response: {
      200: jsonResponse({ data: PluginDebugSessionCreateResponseDTOSchema }),
      400: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  }),
  RefreshKey: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/debug-sessions/key:refresh',
      operationId: 'pluginDebugSession.refreshKey',
      description: 'Refresh a tmbId-scoped plugin debug channel connection key',
      summary: 'Refresh debug connection key',
      tags,
      security: authToken
    },
    request: PluginDebugSessionCreateRequestDTOSchema,
    response: {
      200: jsonResponse({ data: PluginDebugSessionCreateResponseDTOSchema }),
      400: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  }),
  ExchangeConnectionKey: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/debug-sessions/connection-key:exchange',
      operationId: 'pluginDebugSession.exchangeConnectionKey',
      description: 'Exchange a reusable debug connection key for scoped gateway connection info',
      summary: 'Exchange debug connection key',
      tags,
      security: authToken
    },
    request: PluginDebugSessionConnectionKeyExchangeRequestDTOSchema,
    response: {
      200: jsonResponse({ data: PluginDebugSessionConnectionKeyExchangeResponseDTOSchema }),
      400: jsonResponse({ error: ErrorResponseDTOSchema }),
      404: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  }),
  Status: defineContract({
    meta: {
      method: 'get',
      path: '/plugin/debug-sessions/:tmbId',
      operationId: 'pluginDebugSession.status',
      description: 'Get a plugin debug channel status and mounted debug plugins',
      summary: 'Get debug channel status',
      tags,
      security: authToken
    },
    response: {
      200: jsonResponse({ data: PluginDebugSessionStatusResponseDTOSchema }),
      400: jsonResponse({ error: ErrorResponseDTOSchema }),
      404: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  }),
  Revoke: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/debug-sessions/:tmbId/revoke',
      operationId: 'pluginDebugSession.revoke',
      description: 'Close the current plugin debug session without rotating its connection key',
      summary: 'Close debug session',
      tags,
      security: authToken
    },
    request: PluginDebugSessionRevokeRequestDTOSchema,
    response: {
      200: jsonResponse({ data: PluginDebugSessionRevokeResponseDTOSchema }),
      400: jsonResponse({ error: ErrorResponseDTOSchema }),
      404: jsonResponse({ error: ErrorResponseDTOSchema })
    }
  })
} as const;
