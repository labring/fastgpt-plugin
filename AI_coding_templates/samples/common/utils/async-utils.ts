/**
 * 异步控制工具类
 * 提供各种异步操作控制方法
 */
export class AsyncUtils {
  /**
   * 延迟执行
   * @param ms 延迟毫秒数
   * @returns Promise
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 超时控制
   * @param promise 要控制的Promise
   * @param ms 超时毫秒数
   * @returns 带超时的Promise
   */
  static timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`操作超时 (${ms}ms)`)), ms)
      )
    ]);
  }
  
  /**
   * 重试机制
   * @param fn 要重试的函数
   * @param maxAttempts 最大重试次数
   * @param delay 重试间隔
   * @param backoff 是否使用指数退避
   * @returns Promise结果
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000,
    backoff: boolean = true
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        await this.delay(waitTime);
      }
    }
    
    throw lastError!;
  }
  
  /**
   * 并发控制
   * @param tasks 任务数组
   * @param concurrency 并发数
   * @returns Promise结果数组
   */
  static async concurrent<T>(
    tasks: (() => Promise<T>)[],
    concurrency: number = 5
  ): Promise<T[]> {
    const results: T[] = new Array(tasks.length);
    let index = 0;
    
    // 创建工作函数
    const worker = async (): Promise<void> => {
      while (index < tasks.length) {
        const currentIndex = index++;
        if (currentIndex < tasks.length) {
          results[currentIndex] = await tasks[currentIndex]();
        }
      }
    };
    
    // 创建并发工作者
    const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
    
    // 等待所有工作者完成
    await Promise.all(workers);
    
    return results;
  }
  
  /**
   * 批处理
   * @param items 要处理的项目
   * @param processor 批处理函数
   * @param batchSize 批次大小
   * @returns 处理结果数组
   */
  static async batch<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  /**
   * 创建任务队列
   * @returns 队列控制对象
   */
  static createQueue<T>() {
    const queue: (() => Promise<T>)[] = [];
    let processing = false;
    
    const processQueue = async () => {
      if (processing || queue.length === 0) return;
      
      processing = true;
      
      while (queue.length > 0) {
        const task = queue.shift()!;
        try {
          await task();
        } catch (error) {
          console.error('队列任务执行失败:', error);
        }
      }
      
      processing = false;
    };
    
    return {
      add: (task: () => Promise<T>) => {
        queue.push(task);
        processQueue();
      },
      size: () => queue.length,
      clear: () => queue.splice(0),
      isProcessing: () => processing
    };
  }
  
  /**
   * 防抖函数
   * @param func 要防抖的函数
   * @param wait 等待时间
   * @returns 防抖后的函数
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          resolve(func(...args));
        }, wait);
      });
    };
  }
  
  /**
   * 节流函数
   * @param func 要节流的函数
   * @param wait 等待时间
   * @returns 节流后的函数
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => ReturnType<T> | undefined {
    let lastTime = 0;
    
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      const now = Date.now();
      
      if (now - lastTime >= wait) {
        lastTime = now;
        return func(...args);
      }
    };
  }
  
  /**
   * 创建可取消的Promise
   * @param executor Promise执行器
   * @returns 可取消的Promise和取消函数
   */
  static cancellable<T>(
    executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void
  ): { promise: Promise<T>; cancel: () => void } {
    let isCancelled = false;
    let cancelCallback: (() => void) | undefined;
    
    const promise = new Promise<T>((resolve, reject) => {
      cancelCallback = () => {
        isCancelled = true;
        reject(new Error('操作已取消'));
      };
      
      executor(
        (value) => {
          if (!isCancelled) resolve(value);
        },
        (reason) => {
          if (!isCancelled) reject(reason);
        }
      );
    });
    
    return {
      promise,
      cancel: () => cancelCallback?.()
    };
  }
  
  /**
   * 并行执行多个Promise，返回第一个成功的结果
   * @param promises Promise数组
   * @returns 第一个成功的结果
   */
  static async raceSuccess<T>(promises: Promise<T>[]): Promise<T> {
    return new Promise((resolve, reject) => {
      let rejectedCount = 0;
      const errors: any[] = [];
      
      promises.forEach((promise, index) => {
        promise
          .then(resolve)
          .catch(error => {
            errors[index] = error;
            rejectedCount++;
            
            if (rejectedCount === promises.length) {
              reject(new Error(`所有Promise都失败了: ${errors.map(e => e.message).join(', ')}`));
            }
          });
      });
    });
  }
  
  /**
   * 创建信号量（控制并发数）
   * @param maxConcurrency 最大并发数
   * @returns 信号量对象
   */
  static createSemaphore(maxConcurrency: number) {
    let currentCount = 0;
    const waitingQueue: (() => void)[] = [];
    
    const acquire = (): Promise<void> => {
      return new Promise(resolve => {
        if (currentCount < maxConcurrency) {
          currentCount++;
          resolve();
        } else {
          waitingQueue.push(resolve);
        }
      });
    };
    
    const release = (): void => {
      currentCount--;
      if (waitingQueue.length > 0) {
        const next = waitingQueue.shift()!;
        currentCount++;
        next();
      }
    };
    
    return { acquire, release };
  }
  
  /**
   * 使用信号量执行任务
   * @param tasks 任务数组
   * @param maxConcurrency 最大并发数
   * @returns 执行结果数组
   */
  static async withSemaphore<T>(
    tasks: (() => Promise<T>)[],
    maxConcurrency: number
  ): Promise<T[]> {
    const semaphore = this.createSemaphore(maxConcurrency);
    
    const wrappedTasks = tasks.map(task => async () => {
      await semaphore.acquire();
      try {
        return await task();
      } finally {
        semaphore.release();
      }
    });
    
    return Promise.all(wrappedTasks.map(task => task()));
  }
  
  /**
   * 创建异步迭代器
   * @param items 项目数组
   * @param processor 处理函数
   * @returns 异步迭代器
   */
  static async* asyncIterator<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>
  ): AsyncIterableIterator<R> {
    for (const item of items) {
      yield await processor(item);
    }
  }
  
  /**
   * 将异步迭代器转换为数组
   * @param asyncIterable 异步迭代器
   * @returns 结果数组
   */
  static async toArray<T>(asyncIterable: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = [];
    for await (const item of asyncIterable) {
      result.push(item);
    }
    return result;
  }
}