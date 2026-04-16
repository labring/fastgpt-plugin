import { I18nStringSchema } from '@domain/value-objects/i18n-string.vo';

import { defineContract, jsonResponse } from '../contract.type';
import { ModelListDTOSchema, ModelProviderListDTOSchema } from '../dto/model.dto';

import { authToken } from './auth';

export const ModelContract = {
  List: defineContract({
    meta: {
      method: 'get',
      path: '/models',
      operationId: 'model.list',
      description: 'Get a list of all available AI models',
      summary: 'List models',
      tags: ['model'],
      security: authToken
    },
    response: {
      200: jsonResponse({ data: ModelListDTOSchema }),
      500: jsonResponse({ error: I18nStringSchema })
    }
  }),
  GetProviders: defineContract({
    meta: {
      method: 'get',
      path: '/models/get-providers',
      operationId: 'model.getProviders',
      description: 'Get all available model providers with their avatars',
      summary: 'Get model providers',
      tags: ['model'],
      security: authToken
    },
    response: {
      200: jsonResponse({ data: ModelProviderListDTOSchema }),
      500: jsonResponse({ error: I18nStringSchema })
    }
  })
} as const;
