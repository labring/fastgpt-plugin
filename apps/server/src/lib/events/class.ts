import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import type { EventEnumType } from '@fastgpt-plugin/helpers/events';
import type { EventDataType, EventResponseType } from '@fastgpt-plugin/helpers/events/schemas';

/**
 * 发布订阅模式基类, 基于 EventEmitter
 */
export class SubPub {
  private eventBus = new EventEmitter();
  /**
   * 注册事件监听器
   * @param event 事件类型
   * @param handler 事件处理函数，可以返回值或 Promise
   */
  on<E extends EventEnumType>(
    event: E,
    handler: (data: EventDataType<E>) => EventResponseType<E> | Promise<EventResponseType<E>>
  ) {
    this.eventBus.on(event, async (data: any) => {
      try {
        const result = await handler(data);
        // 发送响应事件
        this.eventBus.emit(event, { data: result });
      } catch (error) {
        // 发送错误响应
        this.eventBus.emit(event, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  }

  /**
   * 发送事件（无响应）
   * @param event 事件类型
   * @param data 事件数据
   */
  send<T>(event: EventEnumType, data: T): void {
    this.eventBus.emit(event, data);
  }

  /**
   * 发送事件并等待响应
   * @param event 事件类型
   * @param data 事件数据
   * @param timeout 超时时间（毫秒），默认 30000ms
   * @returns Promise<响应数据>
   */
  sendWithResponse<T = any>(event: EventEnumType, data: any, timeout: number = 30000): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const responseEvent = `${event}:result:${id}`;

      // 设置超时
      const timer = setTimeout(() => {
        this.eventBus.removeAllListeners(responseEvent);
        reject(new Error(`Event '${event}' response timeout after ${timeout}ms`));
      }, timeout);

      // 监听响应
      this.eventBus.once(responseEvent, (result: { data?: T; error?: string }) => {
        clearTimeout(timer);

        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result.data as T);
        }
      });

      // 发送事件（带 id）
      this.eventBus.emit(event, data, id);
    });
  }

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param fn 事件处理函数
   */
  off(event: EventEnumType, fn: (data: any, id?: string) => any | Promise<any>) {
    this.eventBus.off(event, fn);
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
  removeAllListeners(event?: EventEnumType) {
    this.eventBus.removeAllListeners(event);
  }
}
