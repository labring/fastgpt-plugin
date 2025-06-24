import { createExpressEndpoints } from '@ts-rest/express';
import { contract } from '../contract';
import { s } from '../router/init';
import type { Express } from 'express';
import { toolRouter } from '@tool/router';
import { authTokenMiddleware } from './middleware/auth';

export const initRouter = (app: Express) => {
  const router = s.router(contract, {
    tool: toolRouter
  });

  createExpressEndpoints(contract, router, app, {
    jsonQuery: true,
    globalMiddleware: [authTokenMiddleware]
  });
};
