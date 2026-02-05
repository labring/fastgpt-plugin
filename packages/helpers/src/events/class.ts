import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import type { EventEnumType } from './schemas';

/**
 * 发布订阅模式基类
 * 纯静态工具类，基于 EventEmitter
 */
export abstract class SubPub {
  protected static eventBus = new EventEmitter();

  /**
   * 注册事件监听器
   * @param event 事件类型
   * @param fn 事件处理函数，可以返回值或 Promise
   */
  protected static on(event: EventEnumType, fn: (data: any, id?: string) => any | Promise<any>) {
    SubPub.eventBus.on(event, async (data: any, id?: string) => {
      // 如果提供了 id，说明需要响应
      if (id) {
        try {
          const result = await fn(data, id);
          // 发送响应事件
          SubPub.eventBus.emit(`${event}:result:${id}`, { data: result });
        } catch (error) {
          // 发送错误响应
          SubPub.eventBus.emit(`${event}:result:${id}`, {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      } else {
        // 普通事件，不需要响应
        fn(data, id);
      }
    });
  }

  /**
   * 发送事件（无响应）
   * @param event 事件类型
   * @param data 事件数据
   */
  protected static send(event: EventEnumType, data: any): void {
    SubPub.eventBus.emit(event, data);
  }

  /**
   * 发送事件并等待响应
   * @param event 事件类型
   * @param data 事件数据
   * @param timeout 超时时间（毫秒），默认 30000ms
   * @returns Promise<响应数据>
   */
  protected static sendWithResponse<T = any>(
    event: EventEnumType,
    data: any,
    timeout: number = 30000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const responseEvent = `${event}:result:${id}`;

      // 设置超时
      const timer = setTimeout(() => {
        SubPub.eventBus.removeAllListeners(responseEvent);
        reject(new Error(`Event '${event}' response timeout after ${timeout}ms`));
      }, timeout);

      // 监听响应
      SubPub.eventBus.once(responseEvent, (result: { data?: T; error?: string }) => {
        clearTimeout(timer);

        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result.data as T);
        }
      });

      // 发送事件（带 id）
      SubPub.eventBus.emit(event, data, id);
    });
  }

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param fn 事件处理函数
   */
  protected static off(event: EventEnumType, fn: (data: any, id?: string) => any | Promise<any>) {
    SubPub.eventBus.off(event, fn);
  }

  /**
   * 移除指定事件的所有监听器
   * @param event 事件类型。如果不指定，则移除所有事件的所有监听器
   *
   * @example
   * // 移除 file-upload 事件的所有监听器
   * SubPub.removeAllListeners('file-upload');
   *
   * @example
   * // 移除所有事件的所有监听器
   * SubPub.removeAllListeners();
   */
  static removeAllListeners(event?: EventEnumType) {
    SubPub.eventBus.removeAllListeners(event);
  }

  /**
   * 清理所有事件监听器
   */
  static clean() {
    SubPub.eventBus.removeAllListeners();
  }
}
