import express from 'express';
import { initOpenAPI } from './contract/openapi';
import { initRouter } from './router';
import { initTool } from '@tool/init';
import { addLog } from './utils/log';
import { isProd } from './constants';
import { initS3Server } from './s3/config';
import { connectSignoz } from './utils/signoz';
import { initModels } from '@model/init';
import { setupProxy } from './utils/setupProxy';
import { initWorkflowTemplates } from '@workflow/init';

const app = express().use(
  express.json(),
  express.urlencoded({ extended: true }),
  express.static('public', { maxAge: isProd ? '1d' : '0', etag: true, lastModified: true })
);

connectSignoz();

// System
initOpenAPI(app);
initRouter(app);
setupProxy();

// DB
try {
  await initS3Server();
} catch (error) {
  addLog.error('Failed to initialize S3 server:', error);
  process.exit(1);
}

// Modules
await Promise.all([initTool(), initModels(), initWorkflowTemplates()]);

const PORT = parseInt(process.env.PORT || '3000');
const server = app.listen(PORT, (error?: Error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  addLog.info(`FastGPT Plugin Service is listening at http://localhost:${PORT}`);
});

['SIGTERM', 'SIGINT'].forEach((signal) =>
  process.on(signal, () => {
    addLog.debug(`${signal} signal received: closing HTTP server`);
    server.close(() => {
      addLog.info('HTTP server closed');
      process.exit(0);
    });
  })
);
