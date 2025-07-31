import z from 'zod';
import { c } from '@/contract/init';
import { type ListModelsType } from './api/type';

export const modelContract = c.router(
  {
    list: {
      path: '/list',
      method: 'GET',
      description: 'Get model list',
      responses: {
        200: c.type<ListModelsType>()
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
