import Tinypool from 'tinypool';
import { getWorkerFilePath } from './utils';
import type { WorkerEnumType, WorkerParamsMap, WorkerResultMap } from './schemas';

export class WorkerManager {
  static pools: Record<WorkerEnumType, Tinypool> = {
    html2md: new Tinypool({
      filename: getWorkerFilePath('html2md'),
      minThreads: 5,
      maxThreads: 10
    }),
    cherrio2md: new Tinypool({
      filename: getWorkerFilePath('cherrio2md'),
      minThreads: 5,
      maxThreads: 10
    })
  };

  /**
   * 清理所有 Worker 池
   */
  public static async clean() {
    await Promise.all([this.pools.cherrio2md.destroy(), this.pools.html2md.destroy()]);
  }

  /**
   * 运行 Worker 任务
   * @param name Worker 名称
   * @param data Worker 输入参数
   * @param options 运行选项
   * @returns Worker 返回结果
   *
   * @example
   * const markdown = await WorkerManager.run('html2md', { html: '<p>Hello</p>' });
   *
   * @example
   * const result = await WorkerManager.run('cherrio2md', {
   *   fetchUrl: 'https://example.com',
   *   html: '<html>...</html>',
   *   selector: 'body'
   * });
   */
  public static async run<T extends WorkerEnumType>(
    name: T,
    data: WorkerParamsMap[T],
    options?: {
      timeout?: number;
      signal?: AbortSignal;
    }
  ): Promise<WorkerResultMap[T]> {
    const result = await this.pools[name].run(data, options);
    return result as WorkerResultMap[T];
  }
}
