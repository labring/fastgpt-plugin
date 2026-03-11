import { randomUUID } from 'node:crypto';
import { ChildIpcTransport } from './ipc-transport';
import { BasePluginRouter } from './router';

/**
 * Plugin 侧基类，管理生命周期（ready 信号、信号处理）。
 *
 * 构造时自动通过 setImmediate 延迟调用 start()，
 * 确保所有同步的 registerXxx() 调用完成后再发送 ready。
 *
 *   const plugin = new ToolPlugin();
 *   plugin.registerTool(handler);
 *   export { plugin };
 */
export class PluginFactory {
  protected readonly router: BasePluginRouter;
  private readonly _transport: ChildIpcTransport;
  private _started = false;

  constructor() {
    this._transport = new ChildIpcTransport();
    this.router = new BasePluginRouter(this._transport);

    // 所有子类都自动支持 getConfig，由子类覆写 getConfig() 返回各自的配置
    this.router.handle('getConfig', () => this.getConfig());

    setImmediate(() => {
      if (!this._started) {
        this._doStart().catch((err) => {
          console.error('[plugin] start failed:', err);
          process.exit(1);
        });
      }
    });
  }

  /** 子类覆写此方法，返回插件的静态配置（schemas 等）。同时被 getConfig IPC 调用。 */
  public getConfig(): Record<string, unknown> {
    return {};
  }

  private async _doStart(): Promise<void> {
    if (this._started) return;
    this._started = true;

    // 非子进程环境（如构建时静态导入）：跳过 IPC 初始化
    if (!process.send) return;

    process.on('uncaughtException', (err) => {
      console.error('[plugin] uncaughtException:', err);
      process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
      console.error('[plugin] unhandledRejection:', reason);
      process.exit(1);
    });
    process.on('SIGTERM', () => process.exit(0));
    process.on('SIGINT', () => process.exit(0));

    await this._transport.send({
      id: randomUUID(),
      messageType: 'ready',
      timestamp: Date.now()
    });
  }
}
