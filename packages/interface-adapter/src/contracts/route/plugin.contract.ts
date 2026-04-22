import { I18nStringSchema } from '@domain/value-objects/i18n-string.vo';

import { defineContract, emptyResponse, jsonResponse } from '../contract.type';
import {
  PluginBaseDTOSchema,
  PluginConfirmParamsSchema,
  PluginDetailDTOSchema,
  PluginGetParamsSchema,
  PluginInstallDTOSchema,
  PluginListDTOSchema,
  PluginListParamsSchema,
  PluginPruneDisabledResponseDTOSchema,
  PluginRuntimeConfigGetParamsSchema,
  PluginRuntimeConfigSchema,
  PluginRuntimeConfigSetParamsSchema,
  PluginTagListDTOSchema,
  PluginUploadParamsSchema,
  PluginVersionListDTOSchema,
  PluginVersionListParamsSchema
} from '../dto/plugin.dto';

import { authToken } from './auth';

export const PluginContract = {
  Upload: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/upload',
      operationId: 'plugin.upload',
      description: 'Upload a plugin .pkg file and get the plugin info',
      summary: 'Upload a .pkg plugin',
      tags: ['plugin'],
      security: authToken
    },
    request: PluginUploadParamsSchema,
    response: {
      200: jsonResponse({ data: PluginBaseDTOSchema }),
      400: jsonResponse({ error: I18nStringSchema })
    }
  }),
  Confirm: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/confirm',
      operationId: 'plugin.confirm',
      description: 'Confirm the uploaded plugin',
      summary: 'Confirm a plugin',
      tags: ['plugin'],
      security: authToken
    },
    request: PluginConfirmParamsSchema,
    response: {
      200: emptyResponse(),
      500: jsonResponse({ error: I18nStringSchema })
    }
  }),
  PruneDisabled: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/prune-disabled',
      operationId: 'plugin.pruneDisabled',
      description: 'Delete all disabled plugin data from Mongo and storage',
      summary: 'Prune disabled plugins',
      tags: ['plugin'],
      security: authToken
    },
    response: {
      200: jsonResponse({ data: PluginPruneDisabledResponseDTOSchema }),
      500: jsonResponse({ error: I18nStringSchema })
    }
  }),
  Install: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/install',
      operationId: 'plugin.install',
      description: 'Install a plugin',
      summary: 'Install a plugin',
      tags: ['plugin'],
      security: authToken
    },
    request: PluginInstallDTOSchema.request,
    response: {
      200: jsonResponse({ data: PluginInstallDTOSchema.response }),
      500: jsonResponse({ error: I18nStringSchema })
    }
  }),
  Get: defineContract({
    meta: {
      method: 'get',
      path: '/plugin',
      operationId: 'plugin.get',
      description: 'Get a plugin by pluginId, version and source',
      summary: 'Get plugin detail',
      tags: ['plugin'],
      security: authToken
    },
    request: PluginGetParamsSchema,
    response: {
      200: jsonResponse({ data: PluginDetailDTOSchema }),
      404: jsonResponse({ error: I18nStringSchema })
    }
  }),
  List: defineContract({
    meta: {
      method: 'get',
      path: '/plugins',
      operationId: 'plugin.list',
      description: 'List plugins with optional filters',
      summary: 'List plugins',
      tags: ['plugin'],
      security: authToken
    },
    request: PluginListParamsSchema,
    response: {
      200: jsonResponse({ data: PluginListDTOSchema }),
      500: jsonResponse({ error: I18nStringSchema })
    }
  }),
  Versions: defineContract({
    meta: {
      method: 'get',
      path: '/plugin/versions',
      operationId: 'plugin.versions',
      description: 'List all versions of a plugin under the given source',
      summary: 'List plugin versions',
      tags: ['plugin'],
      security: authToken
    },
    request: PluginVersionListParamsSchema,
    response: {
      200: jsonResponse({ data: PluginVersionListDTOSchema }),
      500: jsonResponse({ error: I18nStringSchema })
    }
  }),
  TagList: defineContract({
    meta: {
      method: 'get',
      path: '/plugin/tags',
      operationId: 'plugin.tags',
      description: 'List plugin tags',
      summary: 'List plugin tags',
      tags: ['plugin'],
      security: authToken
    },
    response: {
      200: jsonResponse({ data: PluginTagListDTOSchema }),
      500: jsonResponse({ error: I18nStringSchema })
    }
  }),
  RuntimeConfigGet: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/runtime-config/get',
      operationId: 'plugin.runtimeConfig.get',
      description: 'Get plugin runtime config',
      summary: 'Get plugin runtime config',
      tags: ['plugin'],
      security: authToken
    },
    request: PluginRuntimeConfigGetParamsSchema,
    response: {
      200: jsonResponse({ data: PluginRuntimeConfigSchema }),
      500: jsonResponse({ error: I18nStringSchema })
    }
  }),
  RuntimeConfigSet: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/runtime-config/set',
      operationId: 'plugin.runtimeConfig.set',
      description: 'Set plugin runtime config',
      summary: 'Set plugin runtime config',
      tags: ['plugin'],
      security: authToken
    },
    request: PluginRuntimeConfigSetParamsSchema,
    response: {
      200: emptyResponse(),
      500: jsonResponse({ error: I18nStringSchema })
    }
  })
} as const;
