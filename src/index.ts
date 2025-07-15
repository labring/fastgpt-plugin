import express from 'express';
import { initOpenAPI } from './contract/openapi';
import { initRouter } from './router';
import { initTool } from '@tool/init';
import { addLog } from './utils/log';
import { isProd } from './constants';
import { initS3Server } from './s3/config';

const app = express().use(
  express.json(),
  express.urlencoded({ extended: true }),
  express.static('public', { maxAge: isProd ? '1d' : '0', etag: true, lastModified: true })
);

initOpenAPI(app);
initRouter(app);
try {
  await initS3Server();
} catch (error) {
  addLog.error('Failed to initialize S3 server:', error);
  // only in production environment exit the process, in development environment just log the error
  if (isProd) process.exit(1);
}
initTool();

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
