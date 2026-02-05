import type { FileMetadata } from '../common/schemas/s3';
import { SubPub } from './class';
import { EventEnum } from './schemas';

/**
 * 流式响应事件发布器
 * 纯静态工具类，处理流式响应相关事件
 *
 * @example
 * // 注册监听器
 * StreamResponsePub.register((data) => {
 *   console.log('流式响应:', data);
 * });
 *
 * // 发布事件（无响应）
 * StreamResponsePub.publish({ chunk: 'data' });
 *
 * // 发布事件（带响应）
 * const result = await StreamResponsePub.publishWithResponse({ chunk: 'data' });
 */
export class StreamResponsePub extends SubPub {
  /**
   * 注册流式响应事件监听器
   * @param fn 流式响应事件回调函数
   */
  static register(fn: (data: any, id?: string) => any | Promise<any>): void {
    this.on(EventEnum.enum['stream-response'], fn);
  }

  /**
   * 移除流式响应事件监听器
   * @param fn 流式响应事件回调函数
   */
  static unregister(fn: (data: any, id?: string) => any | Promise<any>): void {
    this.off(EventEnum.enum['stream-response'], fn);
  }

  /**
   * 发布流式响应事件（无响应）
   * @param data 流式响应数据
   */
  static publish(data: any): void {
    this.send(EventEnum.enum['stream-response'], data);
  }

  /**
   * 发布流式响应事件并等待响应
   * @param data 流式响应数据
   * @param timeout 超时时间（毫秒），默认 30000ms
   * @returns Promise<响应结果>
   */
  static publishWithResponse<T = any>(data: any, timeout?: number): Promise<T> {
    return this.sendWithResponse<T>(EventEnum.enum['stream-response'], data, timeout);
  }
}
