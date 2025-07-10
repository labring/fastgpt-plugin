import { Worker } from 'worker_threads';
import { getTool } from 'modules/tool/controller';
import { ToolCallbackReturnSchema } from '../../modules/tool/type/tool';
import { z } from 'zod';
import { addLog } from '@/utils/log';
import { isProd } from '@/constants';
import type { Worker2MainMessageType } from './type';
import { getErrText } from '@tool/utils/err';
import { StreamMessageSchema, StreamMessageType, StreamDataAnswerType } from '@tool/type/stream';

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
  onMessage?: (message: {
    type: StreamMessageType;
    data: z.infer<typeof StreamMessageSchema>;
  }) => void; // streaming callback 可选
}) {
  const { toolId, onMessage } = data;
  const tool = getTool(toolId);

  if (!tool || !tool.cb) {
    return Promise.reject(`Tool with ID ${toolId} not found or does not have a callback.`);
  }

  const isBun = typeof Bun !== 'undefined';
  const workerPath = isProd ? './dist/worker.js' : `${process.cwd()}/dist/worker.js`;
  const worker = new Worker(workerPath, {
    env: {
      NODE_ENV: process.env.NODE_ENV,
      LOG_LEVEL: process.env.LOG_LEVEL
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
        switch (type) {
          case 'log': {
            const logData = Array.isArray(data) ? data : [data];
            console.log(...logData);
            break;
          }
          case 'success': {
            if (onMessage) onMessage({ type: StreamMessageType.DATA, data });
            worker.terminate();
            resolve(data);
            break;
          }
          case 'error': {
            if (onMessage)
              onMessage({
                type: StreamMessageType.ERROR,
                data: { type: StreamDataAnswerType.Error, content: getErrText(data) }
              });
            worker.terminate();
            reject(new Error(getErrText(data)));
            break;
          }
          case 'data': {
            if (onMessage) onMessage({ type: StreamMessageType.DATA, data });
            break;
          }
          case 'uploadFile': {
            try {
              const result = await global.s3Server.uploadFileAdvanced(data);
              worker.postMessage({
                type: 'uploadFileResponse',
                data: { data: result }
              });
            } catch (error) {
              addLog.error(`Tool upload file error`, error);
              worker.postMessage({
                type: 'uploadFileResponse',
                data: { error: 'Tool upload file error' }
              });
            }
            break;
          }
        }
      });

      worker.on('error', (error) => {
        if (onMessage)
          onMessage({
            type: StreamMessageType.ERROR,
            data: { type: StreamDataAnswerType.Error, content: getErrText(error) }
          });
        reject(error);
      });

      worker.on('messageerror', (error) => {
        if (onMessage)
          onMessage({
            type: StreamMessageType.ERROR,
            data: { type: StreamDataAnswerType.Error, content: getErrText(error) }
          });
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          const error = new Error(`Worker stopped with exit code ${code}`);
          if (onMessage)
            onMessage({
              type: StreamMessageType.ERROR,
              data: { type: StreamDataAnswerType.Error, content: getErrText(error) }
            });
          reject(error);
        }
      });

      worker.postMessage({
        type: 'runTool',
        data: {
          toolDirName: tool.toolDirName,
          toolId: data.toolId,
          inputs: data.inputs,
          systemVar: data.systemVar
        }
      });
    }
  );
  return resolvePromise;
}
