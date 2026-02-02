import { isProd } from '@/constants';
import { getLogger, root } from '@/logger';

const logger = getLogger(root);
import express, { type Express } from 'express';

/**
 * 设置全局错误处理，防止未捕获的错误导致进程退出
 */
export const setupGlobalErrorHandling = (app: Express) => {
  // 添加全局错误处理中间件
  app.use(
    (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Express error:', {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        body: {
          url: req.url,
          method: req.method,
          headers: req.headers,
          reqBody: req.body
        }
      });

      // 不调用 next()，防止错误继续传递导致进程崩溃
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: isProd ? 'Internal Server Error' : error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  );
  // 处理 404 错误
  app.use((req: express.Request, res: express.Response) => {
    logger.warn('404: ${req.method} ${req.url}');

    if (!res.headersSent) {
      res.status(404).json({
        error: 'Not Found',
        message: `FastGPT-Plugin Service is running: Router ${req.method} ${req.url} is not found`,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 处理未捕获的异常
  process.on('uncaughtException', (error: Error) => {
    logger.error('未捕获的异常 (uncaughtException):', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    });

    // 记录错误但不退出进程，让开发服务器的重启机制处理
    logger.warn('进程继续运行，依赖自动重启机制处理...');
  });

  // 处理未处理的 Promise 拒绝
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('未处理的 Promise 拒绝 (unhandledRejection):', {
      error: {
        reason: reason?.toString() || reason,
        promise: promise.toString(),
        stack: reason?.stack
      }
    });

    // 记录错误但不退出进程
    logger.warn('Promise 拒绝已记录，进程继续运行...');
  });

  // 处理 warning 事件
  process.on('warning', (warning: Error) => {
    logger.warn('Node.js 警告:', {
      body: {
        name: warning.name,
        message: warning.message,
        stack: warning.stack
      }
    });
  });

  // 添加多个 rejection 处理器以覆盖不同场景
  process.on('rejectionHandled', (promise: Promise<any>) => {
    logger.debug('Promise 拒绝已被处理:', { body: { promise } });
  });

  logger.info('全局错误处理已启用');
};
