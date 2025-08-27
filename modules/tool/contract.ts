import z from 'zod';
import { c } from '@/contract/init';
import { ToolListItemSchema, type ToolListItemType } from './type/api';
import { ToolTypeEnum } from './type/tool';

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
    },
    getType: {
      path: '/getType',
      method: 'GET',
      description: 'Get tool type',
      responses: {
        200: z.array(
          z.object({
            type: z.nativeEnum(ToolTypeEnum),
            name: z.object({
              en: z.string(),
              'zh-CN': z.string(),
              'zh-Hant': z.string()
            })
          })
        )
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
