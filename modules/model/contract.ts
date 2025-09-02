import z from 'zod';
import { c } from '@/contract/init';
import { type ListModelsType } from './api/type';
import { type I18nStringStrictType } from '@/type/i18n';
import type { ModelProviderIdType } from './constants';
import type { aiproxyType } from './constants';

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
    provider: {
      path: '/provider',
      method: 'GET',
      description: 'Get model provider list',
      responses: {
        200: c.type<{
          ModelProviders: Record<ModelProviderIdType, I18nStringStrictType>;
          aiproxyIdMap: aiproxyType;
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
