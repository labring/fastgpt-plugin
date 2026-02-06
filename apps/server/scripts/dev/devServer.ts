import path from 'path';
import { watch } from 'fs/promises';

import { spawn, type Subprocess } from 'bun';
import { getLogger, root } from '@/lib/logger';
import { basePath } from '@/modules/tool/constants';

const logger = getLogger(root);

// DevServer 类管理整个开发环境
export class DevServer {
  private serverProcess: Subprocess | null = null;
  private isRestarting = false;
  private debounceTimer: Timer | null = null;
  private isFirstStart = true;
  private isShuttingDown = false;

  constructor() {
    // 注册信号处理器
    this.registerSignalHandlers();
  }

  // 启动开发环境
  async start() {
    await this.startServer();
    await this.startWatching();
  }

  // 注册信号处理器，确保优雅关闭
  private registerSignalHandlers() {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;

        logger.info(`收到 ${signal} 信号，正在关闭服务...`);
        await this.shutdown();
        process.exit(0);
      });
    });
  }

  // 优雅关闭
  private async shutdown() {
    // 清理防抖定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // 停止服务器进程
    await this.stopServer();

    logger.info('服务已关闭');
  }

  // 启动服务器进程
  private async startServer() {
    if (this.serverProcess) {
      await this.stopServer();
    }

    const cmd = this.isFirstStart
      ? ['bun', 'run', path.join(__dirname, '..', '..', 'main.ts')]
      : ['bun', 'run', path.join(__dirname, '..', '..', 'main.ts'), '--reboot'];

    this.serverProcess = spawn({
      cmd,
      stdout: 'inherit',
      stderr: 'inherit',
      stdin: 'inherit'
      // 确保子进程在父进程退出时也会退出
      // 但不会自动传播信号，我们需要手动处理
    });

    // 监听子进程退出
    this.serverProcess.exited.then((code) => {
      if (!this.isRestarting && !this.isShuttingDown) {
        logger.error(`服务器进程意外退出，退出码: ${code}`);
        process.exit(code || 1);
      }
    });

    this.isFirstStart = false;
  }

  // 停止服务器进程
  private async stopServer() {
    if (!this.serverProcess) return;

    const processToStop = this.serverProcess;
    const pid = processToStop.pid;

    try {
      logger.debug(`准备停止服务器进程 (PID: ${pid})...`);

      if (pid) {
        // 向整个进程组发送 SIGTERM 信号
        // 负号表示发送给进程组
        try {
          process.kill(-pid, 'SIGTERM');
          logger.debug(`向进程组 -${pid} 发送 SIGTERM 信号`);
        } catch (e) {
          // 如果进程组不存在，直接向进程发送信号
          processToStop.kill('SIGTERM');
          logger.debug(`向进程 ${pid} 发送 SIGTERM 信号`);
        }
      } else {
        // 没有 PID，直接 kill
        processToStop.kill('SIGTERM');
      }

      // 创建一个超时 Promise
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          if (pid) {
            logger.warn('进程未在 5 秒内退出，强制终止');
            try {
              process.kill(-pid, 'SIGKILL');
            } catch (e) {
              try {
                processToStop.kill('SIGKILL');
              } catch (killError) {
                // 进程可能已经退出了
              }
            }
          }
          resolve();
        }, 5000);
      });

      // 等待进程退出或超时
      await Promise.race([processToStop.exited, timeoutPromise]);

      // 确保进程已经退出
      if (pid) {
        try {
          // 检查进程是否还存在，如果抛出错误说明进程已退出
          process.kill(pid, 0);
          logger.warn(`进程 ${pid} 可能仍在运行，再等待 500ms...`);
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (e) {
          // 进程不存在了，这是正常的
          logger.debug(`进程 ${pid} 已确认退出`);
        }
      }

      logger.info('服务器进程已完全停止');
    } catch (error) {
      logger.error('停止服务器进程时出错:', { error });
    } finally {
      this.serverProcess = null;
    }
  }

  /**
   * 开始监听文件变化
   */
  private async startWatching() {
    const workpaths = [{ path: path.join(__dirname, '..', '..'), name: 'runtime' }];

    // 为每个目录启动监听
    for (const { path: watchPath, name } of workpaths) {
      this.watchDirectory(watchPath, name);
    }

    logger.info('文件监听已启动');
  }

  /**
   * 监听指定目录
   */
  private watchDirectory(dirPath: string, dirName: string) {
    (async () => {
      try {
        const watcher = watch(dirPath, { recursive: true });

        for await (const event of watcher) {
          if (event.filename) {
            logger.debug(`检测到 ${dirName} 目录文件变化: ${event.filename}`);
            this.restart();
          }
        }
      } catch (error) {
        logger.error(`监听 ${dirName} 目录时出错:`, { error });
        // 可以在这里添加重试逻辑
      }
    })();
  }
  private async restart() {
    logger.debug('检测到文件变化，准备重启...');
    // 如果正在重启或正在关闭，则忽略此次重启
    if (this.isRestarting || this.isShuttingDown) return;

    // 防抖处理
    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(async () => {
      this.debounceTimer = null;
      this.isRestarting = true;

      try {
        logger.info('开始重启服务器...');
        await this.stopServer();
        logger.info('旧服务器已停止，等待端口释放...');

        // 等待端口完全释放，给系统一点时间
        await new Promise((resolve) => setTimeout(resolve, 1000));

        logger.info('启动新服务器...');
        await this.startServer();
        logger.info('服务器重启完成');
      } catch (error) {
        logger.error('重启服务器时出错:', { error });
      } finally {
        this.isRestarting = false;
      }
    }, 1000);
  }
}
