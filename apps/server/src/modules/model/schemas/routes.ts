import { createRoute } from '@hono/zod-openapi';
import { createResponseSchema } from '@/utils/http';
import { ListModelsSchema, GetProvidersResponseSchema } from './common';

// GET / - List all models
export const listModelsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Models'],
  summary: 'List all models',
  description: 'Get a list of all available AI models',
  responses: {
    200: {
      description: 'List of models',
      content: {
        'application/json': {
          schema: createResponseSchema(ListModelsSchema)
        }
      }
    }
  }
});

// GET /get-providers - Get model providers
export const getProvidersRoute = createRoute({
  method: 'get',
  path: '/get-providers',
  tags: ['Models'],
  summary: 'Get model providers',
  description: 'Get all available model providers with their avatars',
  responses: {
    200: {
      description: 'Model providers',
      content: {
        'application/json': {
          schema: createResponseSchema(GetProvidersResponseSchema)
        }
      }
    }
  }
});
