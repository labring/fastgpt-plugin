import z from 'zod';
import { c } from '@/contract/init';
import { ToolListItemSchema, type ToolListItemType } from './type/api';

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
    delete: {
      path: '/delete',
      method: 'DELETE',
      description: 'Delete a tool',
      body: z.object({
        toolId: z.string()
      }),
      responses: {
        200: z.object({
          message: z.string()
        }),
        400: z.object({
          error: z.string()
        }),
        404: z.object({
          error: z.string()
        })
      }
    },
    upload: {
      path: '/upload',
      method: 'POST',
      description: 'Upload and install a tool plugin',
      body: z.object({
        url: z.string()
      }),
      responses: {
        200: z.object({
          message: z.string(),
          mongoResult: z.any(),
          toolId: z.string()
        })
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
