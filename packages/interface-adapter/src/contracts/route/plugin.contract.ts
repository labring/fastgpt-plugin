import { z } from '@hono/zod-openapi';

import { I18nStringSchema } from '@domain/value-objects/i18n-string.vo';

import {
  type ContractMetaType,
  defineContract,
  emptyResponse,
  jsonResponse
} from '../contract.type';
import {
  PluginBaseDTOSchema,
  PluginConfirmParamsSchema,
  PluginInstallDTOSchema,
  PluginListDTOSchema,
  PluginListParamsSchema,
  PluginDeleteParamsSchema,
  PluginPruneDisabledResponseDTOSchema,
  PluginRuntimeConfigGetParamsSchema,
  PluginRuntimeConfigResetParamsSchema,
  PluginRuntimeConfigSchema,
  PluginRuntimeConfigSetParamsSchema,
  PluginTagListDTOSchema,
  PluginUploadParamsSchema,
  PluginUploadResponseDTOSchema,
  PluginVersionListDTOSchema,
  PluginVersionListParamsSchema
} from '../dto/plugin.dto';

import { authToken } from './auth';

const uploadMeta = {
  method: 'post',
  path: '/plugin/upload',
  operationId: 'plugin.upload',
  description:
    'Upload plugin .pkg files or .zip package collection files and get parsed plugin info',
  summary: 'Upload plugin packages',
  tags: ['plugin'],
  security: authToken
} satisfies ContractMetaType;

const uploadResponse = {
  200: jsonResponse({ data: PluginUploadResponseDTOSchema }),
  400: jsonResponse({ error: I18nStringSchema })
};

export const PluginContract = {
  Upload: defineContract({
    meta: uploadMeta,
    request: PluginUploadParamsSchema,
    response: uploadResponse,
    openapi: {
      ...uploadMeta,
      request: {
        body: {
          content: {
            'multipart/form-data': {
              schema: z.object({
                files: z.any()
              })
            }
          }
        }
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: uploadResponse[200]
            }
          }
        },
        400: {
          description: 'HTTP 400 response',
          content: {
            'application/json': {
              schema: uploadResponse[400]
            }
          }
        }
      }
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
  Delete: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/delete',
      operationId: 'plugin.delete',
      description: 'Disable an installed plugin by source, plugin id, and version',
      summary: 'Delete a plugin',
      tags: ['plugin'],
      security: authToken
    },
    request: PluginDeleteParamsSchema,
    response: {
      200: emptyResponse(),
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
  }),
  RuntimeConfigReset: defineContract({
    meta: {
      method: 'post',
      path: '/plugin/runtime-config/reset',
      operationId: 'plugin.runtimeConfig.reset',
      description: 'Reset plugin runtime config',
      summary: 'Reset plugin runtime config',
      tags: ['plugin'],
      security: authToken
    },
    request: PluginRuntimeConfigResetParamsSchema,
    response: {
      200: emptyResponse(),
      500: jsonResponse({ error: I18nStringSchema })
    }
  })
} as const;
