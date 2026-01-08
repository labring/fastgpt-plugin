import type { MessagePort } from 'worker_threads';
import { Worker } from 'worker_threads';
import { join } from 'path';
import { existsSync } from 'fs';
import { addLog } from '@/utils/log';

/**
 * Get the worker file path based on worker name
 * Worker files are located in dist/workers/tool/{workerName}.worker.js
 * Source files are in modules/tool/worker/{workerName}/index.ts
 */
function getWorkerPath(workerName: string): string {
  const workersDir = join(process.cwd(), 'dist', 'workers', 'tool');
  const workerFile = `${workerName}.worker.js`;
  const workerPath = join(workersDir, workerFile);

  return workerPath;
}

export interface WorkerResult {
  type: 'success' | 'error';
  data: any;
}

export const workerExists = (workerName: string): boolean => {
  const workerPath = getWorkerPath(workerName);
  return existsSync(workerPath);
};

/**
 * Run a worker with specified worker name and data
 * @param workerName - The worker name (e.g., 'cheerioToMarkdown', 'htmlToMarkdown')
 * @param data - The data to send to the worker
 * @param timeout - Timeout in milliseconds (default: 30000)
 * @returns Promise with worker result
 *
 * @example
 * const result = await runWorker('cheerioToMarkdown', { fetchUrl, $, selector });
 */
export async function runWorker<T = any>(
  workerName: string,
  data: any,
  timeout: number = 30000
): Promise<T> {
  const workerPath = getWorkerPath(workerName);

  // Exists check
  if (!workerExists(workerName)) {
    throw new Error(`Worker ${workerName} not found, path: ${workerPath}`);
  }

  addLog.debug(`Running worker ${workerName}`);

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath);

    let isResolved = false;

    // Set timeout
    const timer = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        worker.terminate();
        reject(new Error(`Worker timeout after ${timeout}ms`));
      }
    }, timeout);

    // Listen for messages from worker
    worker.on('message', (message: WorkerResult) => {
      if (isResolved) return;

      isResolved = true;
      clearTimeout(timer);
      addLog.debug(`Worker ${workerName} result: ${message.type}`);

      if (message.type === 'success') {
        worker.terminate();
        resolve(message.data);
      } else {
        worker.terminate();
        const errorMsg =
          typeof message.data === 'string' ? message.data : JSON.stringify(message.data);
        reject(new Error(errorMsg));
      }
    });

    // Listen for errors
    worker.on('error', (error) => {
      if (isResolved) return;

      addLog.error(`Worker ${workerName} error`, error);

      isResolved = true;
      clearTimeout(timer);
      worker.terminate();
      reject(error);
    });

    // Listen for exit
    worker.on('exit', (code) => {
      if (isResolved) return;

      isResolved = true;
      clearTimeout(timer);

      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });

    // Send data to worker
    worker.postMessage(data);
  });
}

/**
 * Helper function for worker to send response back to parent
 * This should be used inside worker files
 */
export const workerResponse = ({
  parentPort,
  status,
  data
}: {
  parentPort: MessagePort | null;
  status: 'success' | 'error';
  data: any;
}) => {
  parentPort?.postMessage({
    type: status,
    data: data
  });

  process.exit(0);
};
