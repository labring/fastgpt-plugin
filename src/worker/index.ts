import { Worker } from 'worker_threads';
import { getTool } from '@tool/controller';
import { ToolCallbackReturnSchema } from '../../packages/tool/type/tool';
import { z } from 'zod';
import { addLog } from '@/utils/log';
import { isProd } from '@/constants';
import type { Worker2MainMessageType } from './type';
import { getErrText } from '@tool/utils/err';

type WorkerQueueItem = {
  id: string;
  worker: Worker;
  status: 'running' | 'idle';
  taskTime: number;
  timeoutId?: NodeJS.Timeout;
  resolve: (e: unknown) => void;
  reject: (e: unknown) => void;
};
type WorkerResponse<T = unknown> = {
  id: string;
  type: 'success' | 'error';
  data: T;
};

type WorkerRunTaskType<T> = {
  data: T;
  resolve: (e: unknown) => void;
  reject: (e: unknown) => void;
};

export class WorkerPool<Props = Record<string, unknown>, Response = unknown> {
  maxReservedThreads: number;
  workerQueue: WorkerQueueItem[] = [];
  waitQueue: WorkerRunTaskType<Props>[] = [];

  constructor({ maxReservedThreads }: { maxReservedThreads: number }) {
    this.maxReservedThreads = maxReservedThreads;
  }

  private runTask({ data, resolve, reject }: WorkerRunTaskType<Props>) {
    // Get idle worker or create a new worker
    const runningWorker = (() => {
      const worker = this.workerQueue.find((item) => item.status === 'idle');
      if (worker) return worker;

      if (this.workerQueue.length < this.maxReservedThreads) {
        return this.createWorker();
      }
    })();

    if (runningWorker) {
      // Update memory data to latest task
      runningWorker.status = 'running';
      runningWorker.taskTime = Date.now();
      runningWorker.resolve = resolve;
      runningWorker.reject = reject;
      runningWorker.timeoutId = setTimeout(() => {
        reject('Worker timeout');
      }, 30000);

      runningWorker.worker.postMessage({
        id: runningWorker.id,
        ...data
      });
    } else {
      // Not enough worker, push to wait queue
      this.waitQueue.push({ data, resolve, reject });
    }
  }

  async run(data: Props) {
    // watch memory
    // addLog.debug(`${this.name} worker queueLength: ${this.workerQueue.length}`);

    return new Promise<Response>((resolve, reject) => {
      /*
          Whether the task is executed immediately or delayed, the promise callback will dispatch after task complete.
        */
      this.runTask({
        data,
        resolve: (result: unknown) => resolve(result as Response),
        reject
      });
    }).finally(() => {
      // Run wait queue
      const waitTask = this.waitQueue.shift();
      if (waitTask) {
        this.runTask(waitTask);
      }
    });
  }

  createWorker() {
    // Create a new worker and push it queue.
    const workerId = `${Date.now()}${Math.random()}`;
    const worker = new Worker('./worker.js', {
      env: {},
      resourceLimits: {
        maxOldGenerationSizeMb: parseInt(process.env.MAX_MEMORYMB || '1024')
      }
    });

    const item: WorkerQueueItem = {
      id: workerId,
      worker,
      status: 'running',
      taskTime: Date.now(),
      resolve: () => {},
      reject: () => {}
    };
    this.workerQueue.push(item);

    // watch response
    worker.on('message', ({ type, data }: WorkerResponse<Response>) => {
      if (type === 'success') {
        item.resolve(data);
      } else if (type === 'error') {
        item.reject(data);
      }

      // Clear timeout timer and update worker status
      clearTimeout(item.timeoutId);
      item.status = 'idle';
    });

    // Worker error, terminate and delete it.（Un catch error)
    worker.on('error', (err) => {
      console.log(err);
      this.deleteWorker(workerId);
    });
    worker.on('messageerror', (err) => {
      console.log(err);
      this.deleteWorker(workerId);
    });

    return item;
  }

  private deleteWorker(workerId: string) {
    const item = this.workerQueue.find((item) => item.id === workerId);
    if (item) {
      item.reject?.('error');
      clearTimeout(item.timeoutId);
      item.worker.terminate();
    }

    this.workerQueue = this.workerQueue.filter((item) => item.id !== workerId);
  }
}

const maxReservedThreads = parseInt(process.env.MAX_WORKER || '8');

const workerPool = new WorkerPool({ maxReservedThreads });

export async function dispatch(data: Record<string, unknown>) {
  return await workerPool.run(data);
}

export async function dispatchWithNewWorker(data: {
  toolId: string;
  inputs: Record<string, any>;
  systemVar: Record<string, any>;
}) {
  const { toolId } = data;
  const tool = getTool(toolId);
  if (!tool || !tool.cb) {
    console.error(`Tool with ID ${toolId} not found or does not have a callback.`);
    return;
  }

  const isBun = typeof Bun !== 'undefined';
  const workerPath = isProd ? './dist/worker.js' : `${process.cwd()}/dist/worker.js`;
  const worker = new Worker(workerPath, {
    env: {
      NODE_ENV: process.env.NODE_ENV,
      LOG_LEVEL: process.env.LOG_LEVEL,
      PROXY_HOST: process.env.PROXY_HOST,
      PROXY_PORT: process.env.PROXY_PORT,
      PROXY_USERNAME: process.env.PROXY_USERNAME,
      PROXY_PASSWORD: process.env.PROXY_PASSWORD
    },
    ...(isBun
      ? {}
      : {
          resourceLimits: {
            maxOldGenerationSizeMb: parseInt(process.env.MAX_MEMORYMB || '1024')
          }
        })
  });

  const resolvePromise = new Promise<z.infer<typeof ToolCallbackReturnSchema>>(
    (resolve, reject) => {
      worker.on('message', async ({ type, data }: Worker2MainMessageType) => {
        if (type === 'success') {
          resolve(data);
          worker.terminate();
        } else if (type === 'error') {
          reject(data);
          worker.terminate();
        } else if (type === 'log') {
          const logData = Array.isArray(data) ? data : [data];
          console.log(...logData);
        } else if (type === 'uploadFile') {
          try {
            const result = await global.s3Server.uploadFileAdvanced(data);
            worker.postMessage({
              type: 'uploadFileResponse',
              data: {
                type: 'success',
                data: result
              }
            });
          } catch (error) {
            worker.postMessage({
              type: 'uploadFileResponse',
              data: {
                type: 'error',
                data: getErrText(error)
              }
            });
          }
        }
      });

      worker.on('error', (err) => {
        addLog.error(`Run tool error`, err);
        reject(err);
        worker.terminate();
      });
      worker.on('messageerror', (err) => {
        addLog.error(`Run tool error`, err);
        reject(err);
        worker.terminate();
      });

      worker.postMessage({
        type: 'runTool',
        data: {
          toolDirName: tool.toolDirName,
          ...data
        }
      });
    }
  );

  return resolvePromise;
}
