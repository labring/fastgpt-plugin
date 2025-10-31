import { z } from 'zod';
import { c } from '@/contract/init';
import { type ListModelsType } from './api/type';
import { type I18nStringStrictType } from '@/type/i18n';
import type { AiproxyMapProviderType } from './constants';

export const modelContract = c.router(
  {
    list: {
      path: '/list',
      method: 'GET',
      description: 'Get model list',
      responses: {
        200: c.type<ListModelsType>()
      }
    },
    getProviders: {
      path: '/getProviders',
      method: 'GET',
      description: 'Get model provider list',
      responses: {
        200: c.type<{
          modelProviders: { provider: string; value: I18nStringStrictType }[];
          aiproxyIdMap: AiproxyMapProviderType;
        }>()
      }
    }
  },
  {
    pathPrefix: '/model',
    commonResponse: {
      500: z.object({
        error: z.string()
      })
    }
  }
);
