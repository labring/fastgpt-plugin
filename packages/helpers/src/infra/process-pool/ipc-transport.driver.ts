import { randomUUID } from 'node:crypto';
import { type PluginTransportPort } from '@fastgpt-plugin/domain/ports/plugin-transport.port';
import type { PluginIOMessage } from '@fastgpt-plugin/domain/value-objects/plugin-message.vo';

/**
 * 插件侧 IPC transport（运行在子进程中）。
 * 通过 process.send / process.on('message') 与 host 通信。
 */
export class IPCTransport implements PluginTransportPort {
  readonly transportType = 'ipc' as const;

  async send(message: PluginIOMessage): Promise<void> {
    if (!process.send) throw new Error('process.send is not available (not a child process)');
    return new Promise((resolve, reject) => {
      (process.send as unknown as (msg: unknown, cb: (err: Error | null) => void) => void)(
        message,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  onMessage(handler: (message: PluginIOMessage) => void): () => void {
    const listener = (msg: unknown) => {
      if (msg && typeof msg === 'object' && 'messageType' in msg) {
        handler(msg as PluginIOMessage);
      }
    };
    process.on('message', listener);
    return () => process.off('message', listener);
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  /** 向 host 发送 ready 信号 */
  sendReady(): Promise<void> {
    return this.send({ id: randomUUID(), messageType: 'ready', timestamp: Date.now() });
  }
}
