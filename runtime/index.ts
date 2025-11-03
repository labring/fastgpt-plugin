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
import { initModelAvatars } from '@model/avatars';
import { basePath, tempDir, tempToolsDir } from '@tool/constants';
import { initWorkflowTemplates } from '@workflow/init';
import express from 'express';
import { join } from 'path';

// 全局错误处理设置
setupGlobalErrorHandling();

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

// 添加全局错误处理中间件
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  addLog.error('Express 应用错误:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    url: req.url,
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  // 不调用 next()，防止错误继续传递导致进程崩溃
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: isProd ? '服务器内部错误' : error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 处理 404 错误
app.use((req: express.Request, res: express.Response) => {
  addLog.warn(`404: ${req.method} ${req.url}`);

  if (!res.headersSent) {
    res.status(404).json({
      error: 'Not Found',
      message: `FastGPT-Plugin Service is running: Router ${req.method} ${req.url} is not found`,
      timestamp: new Date().toISOString()
    });
  }
});

// DB
try {
  await connectMongo(connectionMongo, MONGO_URL);
} catch (error) {
  addLog.error('Failed to initialize services:', error);
  process.exit(1);
}

await initializeS3();

// Upload model provider avatars to S3
await initModelAvatars();

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

/**
 * 设置全局错误处理，防止未捕获的错误导致进程退出
 */
function setupGlobalErrorHandling() {
  // 处理未捕获的异常
  process.on('uncaughtException', (error: Error) => {
    addLog.error('未捕获的异常 (uncaughtException):', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // 记录错误但不退出进程，让开发服务器的重启机制处理
    addLog.warn('进程继续运行，依赖自动重启机制处理...');
  });

  // 处理未处理的 Promise 拒绝
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    addLog.error('未处理的 Promise 拒绝 (unhandledRejection):', {
      reason: reason?.toString() || reason,
      promise: promise.toString(),
      stack: reason?.stack
    });

    // 记录错误但不退出进程
    addLog.warn('Promise 拒绝已记录，进程继续运行...');
  });

  // 处理 warning 事件
  process.on('warning', (warning: Error) => {
    addLog.warn('Node.js 警告:', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    });
  });

  // 添加多个 rejection 处理器以覆盖不同场景
  process.on('rejectionHandled', (promise: Promise<any>) => {
    addLog.debug('Promise 拒绝已被处理:', promise);
  });

  addLog.info('全局错误处理已启用');
}
