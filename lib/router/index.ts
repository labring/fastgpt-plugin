import { createExpressEndpoints } from '@ts-rest/express';
import { contract } from '../contract';
import { s } from '../router/init';
import type { Express } from 'express';
import { toolRouter } from '@tool/router';
import { modelRouter } from '@model/router';
import { runToolStreamHandler } from '@tool/api/runStream';
import { authTokenMiddleware } from './middleware/auth';
import { workflowRouter } from '@workflow/router';

export const initRouter = (app: Express) => {
  const router = s.router(contract, {
    tool: toolRouter,
    model: modelRouter,
    workflow: workflowRouter
  });

  createExpressEndpoints(contract, router, app, {
    jsonQuery: true,
    globalMiddleware: [authTokenMiddleware]
  });

  // Register Stream streaming routing
  app.use('/tool/runstream', (req, res, next) => {
    authTokenMiddleware(req, res, () => {
      runToolStreamHandler(req, res, next).catch(next);
    });
  });
};
