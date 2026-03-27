/**
 * Plugin 通信架构
 *
 * PluginService => PluginRouter
 */
import type { TransportType } from '../value-objects/plugin-io.vo';
import type { PluginIOMessage } from '../value-objects/plugin-manager.vo';

/**
 * Plugin Transport (底层)
 * Plugin 通信的底层设计，
 */
export interface PluginTransportPort {
  readonly transportType: TransportType;

  send(message: PluginIOMessage): Promise<void>;
  /** 注册消息处理器，返回取消订阅函数 */
  onMessage(handler: (message: PluginIOMessage) => void): () => void;
  close(): Promise<void>;
}
