import { createExpressEndpoints } from '@ts-rest/express';
import { contract } from '../contract';
import { s } from '../router/init';
import type { Express } from 'express';
import { toolRouter } from '@tool/router';
import { modelRouter } from '@model/router';
import { runToolStreamHandler } from '@tool/api/runStream';
import { authTokenMiddleware } from './middleware/auth';
import { uploadHandler } from '@tool/api/upload';
import { deleteHandler } from '@tool/api/delete';

export const initRouter = (app: Express) => {
  const router = s.router(contract, {
    tool: toolRouter,
    model: modelRouter
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

  app.post('/tool/upload', (req, res, next) => {
    uploadHandler(req, res, next).catch(next);
  });

  app.post('/tool/delete', (req, res, next) => {
    deleteHandler(req, res, next).catch(next);
  });
};
