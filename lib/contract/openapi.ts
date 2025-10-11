import { generateOpenApi } from '@ts-rest/open-api';
import { contract } from '.';
import type { Express } from 'express';
import { apiReference } from '@scalar/express-api-reference';

export const initOpenAPI = (app: Express) => {
  // OpenAPI document
  const openApiDocument = generateOpenApi(contract, {
    info: {
      title: 'FastGPT-plugin API document',
      version: '0.0.1',
      description: 'FastGPT-plugin API document'
    }
  });
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
