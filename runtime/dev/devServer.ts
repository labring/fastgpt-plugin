import path from 'path';
import { watch } from 'fs/promises';
import { $ } from 'bun';
import { addLog } from '@/utils/log';
import { spawn, type Subprocess } from 'bun';
import { basePath } from '@tool/constants';

// DevServer 类管理整个开发环境
export class DevServer {
  private serverProcess: Subprocess | null = null;
  private isRestarting = false;
  private debounceTimer: Timer | null = null;
  private isFirstStart = true;

  // 启动开发环境
  async start() {
    await this.buildWorker();
    await this.startServer();
    await this.startWatching();
  }

  // 构建 worker
  private async buildWorker() {
    try {
      addLog.info('Building worker...');
      await $`bun run build:worker`;
      addLog.info('Worker built successfully');
    } catch (error) {
      addLog.error('Failed to build worker:', error);
    }
  }

  // 启动服务器进程
  private async startServer() {
    if (this.serverProcess) {
      await this.stopServer();
    }

    const cmd = this.isFirstStart
      ? ['bun', 'run', path.join(__dirname, '..', 'index.ts')]
      : ['bun', 'run', path.join(__dirname, '..', 'index.ts'), '--reboot'];

    this.serverProcess = spawn({
      cmd,
      stdout: 'inherit',
      stderr: 'inherit',
      stdin: 'inherit'
    });

    this.isFirstStart = false;
  }

  // 停止服务器进程
  private async stopServer() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }

  /**
   * 开始监听文件变化
   */
  private async startWatching() {
    const workpaths = [
      { path: path.join(__dirname, '..'), name: 'runtime' },
      { path: path.join(basePath, 'modules'), name: 'modules' }
    ];

    // 为每个目录启动监听
    for (const { path: watchPath, name } of workpaths) {
      this.watchDirectory(watchPath, name);
    }

    addLog.info('文件监听已启动');
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
            addLog.debug(`检测到 ${dirName} 目录文件变化: ${event.filename}`);
            this.restart();
          }
        }
      } catch (error) {
        addLog.error(`监听 ${dirName} 目录时出错:`, error);
        // 可以在这里添加重试逻辑
      }
    })();
  }
  private async restart() {
    addLog.debug(`Worker file changed, rebuilding...`);
    // 如果正在重启，则忽略此次重启
    if (this.isRestarting) return;
    // 如果正在重启，则忽略此次重启
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.isRestarting = true;
      this.stopServer();
      this.startServer();
      this.isRestarting = false;
    }, 1000);
  }
}
