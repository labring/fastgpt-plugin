import { PluginRuntimeModeEnum, type PluginRuntimeModeType } from '@domain/value-objects/plugin.vo';
import { createCurrentProcessIpcChannel } from '@infrastructure/plugin/plugin-runtime/drivers/local-pool/ipc-channel';

import {
  LOCAL_DEBUG_RUNTIME_GLOBAL_KEY,
  type LocalDebugRuntimeLike,
  type PluginRuntimeChannel
} from './runtime-channel.type';

// export type PluginFactoryDeps = {};

/**
 * Plugin 侧基类，管理生命周期（ready 信号、信号处理）。
 * 不要直接实例化这个类，而是继承它来创建具体的 PluginFactory
 */
export class PluginFactory {
  private channel: PluginRuntimeChannel | undefined;

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
    if (process.env.RUNTIME_MODE === 'dev') {
      this.mode = 'dev';
    }
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
      this.channel = getCurrentLocalDebugRuntime().pluginChannel;
      setImmediate(() => this.getChannel().sendReady());
    }
  }

  protected constructor() {
    void this.init();
  }
}

function getCurrentLocalDebugRuntime(): LocalDebugRuntimeLike {
  const store = globalThis as typeof globalThis & {
    [LOCAL_DEBUG_RUNTIME_GLOBAL_KEY]?: LocalDebugRuntimeLike;
  };
  const runtime = store[LOCAL_DEBUG_RUNTIME_GLOBAL_KEY];

  if (!runtime) {
    throw new Error('Local debug runtime is not initialized. Set it before importing the plugin.');
  }

  return runtime;
}
