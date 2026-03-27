import { randomUUID } from 'node:crypto';
import {
  BasePluginRouter,
  type IPluginRouterPort
} from '@fastgpt-plugin/domain/ports/plugin-router.port';
import { IPCTransport } from '@fastgpt-plugin/helpers/infra/process-pool/ipc-transport.driver';
import {
  SystemModeEnum,
  type SystemModeType
} from '@fastgpt-plugin/domain/value-objects/system-mode.enum';
import type { PluginTransportPort } from '@fastgpt-plugin/domain/ports/plugin-transport.port';

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
  private readonly _transport: PluginTransportPort;
  protected readonly router: IPluginRouterPort;

  private _started = false;
  private mode: SystemModeType;
  /** 当前执行上下文的反向调用 token（由 Host 注入到 execute params 中） */
  protected _callbackToken?: string;

  constructor() {
    const mode = process.env.MODE as SystemModeType;
    if (!Object.values(SystemModeEnum).includes(mode)) {
      throw new Error(`[Init Plugin Error] Invalid mode: ${mode}`);
    }
    this.mode = mode;

    this._transport = (() => {
      switch (this.mode) {
        case 'local':
          return new IPCTransport();
        case 'remote':
        default:
          throw new Error(`[Init Plugin Error] Unsupported mode: ${this.mode}`);
      }
    })();

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

  /**
   * 反向调用 Host 服务（底层 IPC RPC）。
   * 需要 _callbackToken 已在当前执行上下文中设置。
   */
  protected callHost(method: string, args: unknown): Promise<unknown> {
    if (!this._callbackToken) {
      throw new Error('No callbackToken: not in host execution context');
    }
    return this.router.request('hostCallback', {
      callbackToken: this._callbackToken,
      method,
      args
    });
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
