import { PluginRuntimeModeEnum, type PluginRuntimeModeType } from '@domain/value-objects/plugin.vo';
import {
  createCurrentProcessIpcChannel,
  PluginIpcChannel
} from '@infrastructure/plugin/plugin-runtime/drivers/local-pool/ipc-channel';

// export type PluginFactoryDeps = {};

/**
 * Plugin 侧基类，管理生命周期（ready 信号、信号处理）。
 * 不要直接实例化这个类，而是继承它来创建具体的 PluginFactory
 */
export class PluginFactory {
  private channel: PluginIpcChannel | undefined;

  protected getChannel() {
    if (!this.channel) {
      throw new Error('Channel is not initialized yet.');
    }
    return this.channel;
  }

  protected mode: PluginRuntimeModeType | 'dev' | undefined;

  private checkRuntimeMode() {
    if (process.env.RUNTIME_MODE == PluginRuntimeModeEnum.localPool) {
      this.mode = PluginRuntimeModeEnum.localPool;
    }
    // if no RUNTIME_MODE, running in local dev.
  }

  protected async init() {
    this.checkRuntimeMode();
    // 1. 注册监听
    // 2. 发送 ready 信号
    if (this.mode === 'localPool') {
      this.channel = createCurrentProcessIpcChannel();
      setImmediate(() => this.getChannel().sendReady());
    }
    if (this.mode === 'dev') {
      // TODO: 后续提供完全功能的本地 dev 调试工具
      this.channel = {
        setRequestHandler: (handler) => {
          console.log('[Local Dev] Request handler registered:', handler);
        }
      } as PluginIpcChannel;
      console.log('[Local Dev] Plugin initialized successfully.');
    }
  }

  protected constructor() {
    this.init();
  }
}
