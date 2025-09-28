import z from 'zod';
import { c } from '@/contract/init';
import { ToolListItemSchema, type ToolListItemType, ToolTypeListSchema } from './type/api';

export const toolUploadContract = c.router(
  {
    getUploadURL: {
      path: '/getUploadURL',
      query: z.object({
        filename: z.string()
      }),
      responses: {
        200: z.object({
          postURL: z.string(),
          formData: z.record(z.any()),
          objectName: z.string()
        })
      },
      method: 'GET',
      description: 'Get presigned upload URL'
    },
    delete: {
      path: '/delete',
      method: 'DELETE',
      description: 'Delete a tool',
      query: z.object({
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
    confirmUpload: {
      path: '/confirmUpload',
      method: 'POST',
      description: 'Upload and install a tool plugin',
      body: z.object({
        objectName: z.string()
      }),
      responses: {
        200: z.object({
          message: z.string()
        })
      }
    }
  },
  {
    pathPrefix: '/upload'
  }
);

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
        200: ToolTypeListSchema
      }
    },
    upload: toolUploadContract
  },
  {
    pathPrefix: '/tool'
  }
);
