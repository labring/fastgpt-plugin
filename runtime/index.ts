import { getCachedData } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';
import { isProd } from '@/constants';
import { initOpenAPI } from '@/contract/openapi';
import { connectionMongo, connectMongo, MONGO_URL } from '@/mongo';
import { initRouter } from '@/router';
import { initializeS3 } from '@/s3';
import { ensureDir, refreshDir } from '@/utils/fs';
import { addLog } from '@/utils/log';
import { setupProxy } from '@/utils/setupProxy';
import { connectSignoz } from '@/utils/signoz';
import { initModels } from '@model/init';
import { basePath, tempDir, tempToolsDir } from '@tool/constants';
import { initWorkflowTemplates } from '@workflow/init';
import express from 'express';
import { join } from 'path';
import { setupGlobalErrorHandling } from './utils/error';

const requestSizeLimit = `${Number(process.env.MAX_API_SIZE || 10)}mb`;

const app = express().use(
  express.json({ limit: requestSizeLimit }),
  express.urlencoded({ extended: true, limit: requestSizeLimit }),
  express.static(isProd ? 'public' : join(basePath, 'dist', 'public'), {
    maxAge: isProd ? '1d' : '0',
    etag: true,
    lastModified: true
  })
);

connectSignoz();

// System
initOpenAPI(app);
initRouter(app);
setupProxy();

// DB
try {
  await connectMongo(connectionMongo, MONGO_URL);
} catch (error) {
  addLog.error('Failed to initialize services:', error);
  process.exit(1);
}

await initializeS3();

// Modules
await refreshDir(tempDir); // upload pkg files, unpkg, temp dir
await ensureDir(tempToolsDir); // ensure the unpkged tools temp dir

await Promise.all([
  getCachedData(SystemCacheKeyEnum.systemTool), // init system tool
  initModels(),
  initWorkflowTemplates()
]);

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

// 全局错误处理设置
setupGlobalErrorHandling(app);
