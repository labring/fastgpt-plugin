import { generateOpenApi } from '@ts-rest/open-api';
import { contract } from '.';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

export const initOpenAPI = (app: Express) => {
  // OpenAPI document
  const openApiDocument = generateOpenApi(contract, {
    info: {
      title: 'FastGPT-plugin API document',
      version: '0.0.1',
      description: 'FastGPT-plugin API document'
    }
  });
  app.use('/openapi', swaggerUi.serve);
  app.get('/openapi', swaggerUi.serve, swaggerUi.setup(openApiDocument));
};
