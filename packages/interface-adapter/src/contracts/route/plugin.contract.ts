import { I18nStringSchema } from '@domain/value-objects/i18n-string.vo';

import {
  defineContract,
  emptyResponse,
  formDataBody,
  jsonBody,
  jsonResponse
} from '../contract.type';
import {
  PluginDTOSchema,
  PluginInstallDTOSchema,
  PluginListParamsSchema,
  PluginRuntimeConfigGetParamsSchema,
  PluginRuntimeConfigSchema,
  PluginRuntimeConfigSetParamsSchema,
  PluginTagListDTOSchema,
  PluginUniqueIdDTOSchema,
  PluginUploadParamsSchema
} from '../dto/plugin.dto';

import { authToken } from './auth';

export const PluginUploadContract = defineContract({
  method: 'POST',
  path: '/plugin/upload',
  operationId: 'plugin.upload',
  description: 'Upload a plugin .pkg file and get the plugin info',
  summary: 'Upload a .pkg plugin',
  tags: ['plugin'],
  request: {
    body: formDataBody(PluginUploadParamsSchema)
  },
  response: {
    200: jsonResponse({ data: PluginDTOSchema }),
    400: jsonResponse({ error: I18nStringSchema })
  },
  security: authToken
});

export const PluginConfirmContract = defineContract({
  method: 'POST',
  path: '/plugin/confirm',
  operationId: 'plugin.confirm',
  description: 'Confirm the uploaded plugin',
  summary: 'Confirm a plugin',
  tags: ['plugin'],
  request: {
    body: jsonBody(PluginUniqueIdDTOSchema)
  },
  response: {
    200: emptyResponse(),
    500: jsonResponse({ error: I18nStringSchema })
  },
  security: authToken
});

export const PluginInstallContract = defineContract({
  method: 'POST',
  path: '/plugin/install',
  operationId: 'plugin.install',
  description: 'Install a plugin',
  summary: 'Install a plugin',
  tags: ['plugin'],
  request: {
    body: jsonBody(PluginInstallDTOSchema.request)
  },
  response: {
    200: jsonResponse({ data: PluginInstallDTOSchema.response }),
    500: jsonResponse({ error: I18nStringSchema })
  },
  security: authToken
});

export const PluginListContract = defineContract({
  method: 'GET',
  path: '/plugins',
  operationId: 'plugin.list',
  description: 'List plugins with optional filters',
  summary: 'List plugins',
  tags: ['plugin'],
  request: {
    body: jsonBody(PluginListParamsSchema)
  },
  response: {
    200: jsonResponse({ data: PluginDTOSchema.array() }),
    500: jsonResponse({ error: I18nStringSchema })
  },
  security: authToken
});

export const PluginTagListContract = defineContract({
  method: 'GET',
  path: '/plugin/tags',
  operationId: 'plugin.tags',
  description: 'List plugin tags',
  summary: 'List plugin tags',
  tags: ['plugin'],
  response: {
    200: jsonResponse({ data: PluginTagListDTOSchema }),
    500: jsonResponse({ error: I18nStringSchema })
  },
  security: authToken
});

export const PluginRuntimeConfigGetContract = defineContract({
  method: 'POST',
  path: '/plugin/runtime-config/get',
  operationId: 'plugin.runtimeConfig.get',
  description: 'Get plugin runtime config',
  summary: 'Get plugin runtime config',
  tags: ['plugin'],
  request: {
    body: jsonBody(PluginRuntimeConfigGetParamsSchema)
  },
  response: {
    200: jsonResponse({ data: PluginRuntimeConfigSchema }),
    500: jsonResponse({ error: I18nStringSchema })
  },
  security: authToken
});

export const PluginRuntimeConfigSetContract = defineContract({
  method: 'POST',
  path: '/plugin/runtime-config/set',
  operationId: 'plugin.runtimeConfig.set',
  description: 'Set plugin runtime config',
  summary: 'Set plugin runtime config',
  tags: ['plugin'],
  request: {
    body: jsonBody(PluginRuntimeConfigSetParamsSchema)
  },
  response: {
    200: emptyResponse(),
    500: jsonResponse({ error: I18nStringSchema })
  },
  security: authToken
});
