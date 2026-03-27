import { EventEmitter } from 'node:events';
import type { EventEnumType } from '@fastgpt-plugin/helpers/events';
import type { EventDataType, EventResponseType } from '@fastgpt-plugin/helpers/events/schemas';
import type { SystemVarType } from '@fastgpt-plugin/helpers/index';

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
    handler: (data: {
      data: EventDataType<E>;
      props: { systemVar: SystemVarType };
    }) => EventResponseType<E> | Promise<EventResponseType<E>>
  ) {
    this.eventBus.on(event, async (data: any) => {
      try {
        const result = await handler(data);
        // 发送响应事件
        this.eventBus.emit(`${event}:result`, { data: result });
      } catch (error) {
        // 发送错误响应
        this.eventBus.emit(`${event}:result`, {
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
  sendWithResponse<T extends EventEnumType>(
    event: T,
    data: { data: EventDataType<T>; props: { systemVar: SystemVarType } },
    timeout: number = 30000
  ): Promise<EventResponseType<T>> {
    return new Promise((resolve, reject) => {
      // 设置超时
      const timer = setTimeout(() => {
        this.eventBus.removeAllListeners(event);
        reject(new Error(`Event '${event}' response timeout after ${timeout}ms`));
      }, timeout);

      // 监听响应
      this.eventBus.once(
        `${event}:result`,
        (result: { data?: EventResponseType<T>; error?: string }) => {
          clearTimeout(timer);

          if (result.data) {
            resolve(result.data);
          } else {
            reject(new Error(result.error ?? 'Unknown error'));
          }
        }
      );

      this.eventBus.emit(event, data);
    });
  }
  // TODO: 发送事件，监听回调流，直到结束
  // sendAndListenResponseStream

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
