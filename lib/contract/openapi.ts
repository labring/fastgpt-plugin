import { generateOpenApi } from '@ts-rest/open-api';
import { contract } from '.';
import type { Express } from 'express';
import { apiReference } from '@scalar/express-api-reference';
import type { OpenAPIObject } from 'openapi3-ts/oas30';
import { OpenApiBuilder } from 'openapi3-ts/oas30';

export const addStreamAPI = (openapi: OpenAPIObject) => {
  const builder = new OpenApiBuilder(openapi);
  builder.addPath('/tool/runstream', {
    post: {
      tags: ['tool'],
      parameters: [
        {
          name: 'authtoken',
          in: 'header',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Authorization token for API access'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            example: {
              toolId: 'example',
              inputs: {
                param1: 'value1',
                param2: 'value2'
              },
              systemVar: {
                var1: 'value1',
                var2: 'value2'
              }
            },
            schema: {
              type: 'object',
              required: ['toolId', 'inputs', 'systemVar'],
              properties: {
                toolId: {
                  type: 'string',
                  description: 'Tool ID',
                  example: 'example'
                },
                inputs: {
                  type: 'object',
                  description: 'Tool input parameters',
                  additionalProperties: true
                },
                systemVar: {
                  type: 'object',
                  description: 'System variables',
                  additionalProperties: true
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Stream response',
          content: {
            'text/event-stream': {
              schema: {
                type: 'object',
                description: 'Server-Sent Events stream',
                properties: {
                  event: {
                    type: 'string',
                    description: 'Event type'
                  },
                  data: {
                    type: 'string',
                    description: 'Event data'
                  },
                  id: {
                    type: 'string',
                    description: 'Event ID'
                  },
                  retry: {
                    type: 'integer',
                    description: 'Retry time in milliseconds'
                  }
                }
              }
            }
          }
        }
      }
    }
  });
};

export const initOpenAPI = (app: Express) => {
  // OpenAPI document
  const openApiDocument = generateOpenApi(contract, {
    info: {
      title: 'FastGPT-plugin API document',
      version: '0.0.1',
      description: 'FastGPT-plugin API document'
    }
  });
  addStreamAPI(openApiDocument);

  app.use(
    '/openapi',
    apiReference({
      url: '/openapi.json'
    })
  );
  app.get('/openapi.json', (req, res) => {
    res.json(openApiDocument);
  });
};
