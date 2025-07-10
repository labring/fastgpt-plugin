import z from 'zod';
import { c } from '@/contract/init';
import { ToolListItemSchema, type ToolListItemType } from './type/api';
import { SystemVarSchema } from './type/tool';

export const toolContract = c.router(
  {
    list: {
      path: '/list',
      method: 'GET',
      description: 'Get tools list',
      responses: {
        200: c.type<Array<ToolListItemType>>()
      }
    },
    getTool: {
      path: '/get',
      method: 'GET',
      description: 'Get a tool',
      query: z.object({
        toolId: z.string()
      }),
      responses: {
        200: ToolListItemSchema
      }
    }
  },
  {
    pathPrefix: '/tool',
    commonResponse: {
      401: z.object({
        error: z.string()
      }),
      404: z.object({
        error: z.string()
      }),
      500: z.object({
        error: z.string()
      })
    }
  }
);
