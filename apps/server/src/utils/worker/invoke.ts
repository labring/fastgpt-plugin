import { parentPort } from 'worker_threads';
import { getNanoid } from '@tool/utils/string';

declare global {
  var invokeResponseFnMap: Map<string, (data: { data?: any; error?: string }) => void>;
}

/**
 * Invoke FastGPT API method from worker thread
 *
 * @param method - The method name to invoke (e.g., 'getAccessToken')
 * @param params - Optional parameters for the method
 * @returns Promise that resolves with the method result
 *
 * @example
 * ```typescript
 * import { invoke } from '@/invoke';
 *
 * const token = await invoke<string>('getAccessToken', {});
 * ```
 */
export async function invoke<TResult = any>(method: string, params?: any): Promise<TResult> {
  const isWorkerThread = typeof parentPort !== 'undefined' && parentPort !== null;

  if (!isWorkerThread) {
    throw new Error('invoke() can only be called from worker thread');
  }

  return new Promise<TResult>((resolve, reject) => {
    const id = getNanoid();

    const timer = setTimeout(() => {
      global.invokeResponseFnMap?.delete(id);
      reject(new Error(`Invoke ${method} timeout after 120 seconds`));
    }, 120000); // 120s timeout

    // Initialize global Map if not exists
    if (!global.invokeResponseFnMap) {
      global.invokeResponseFnMap = new Map();
    }

    // Define callback function
    const callback = ({ data, error }: { data?: any; error?: string }) => {
      clearTimeout(timer);
      global.invokeResponseFnMap.delete(id);

      if (error) {
        reject(new Error(error));
      } else {
        resolve(data as TResult);
      }
    };

    // Store callback with unique ID
    global.invokeResponseFnMap.set(id, callback);

    // Send message to main thread
    parentPort?.postMessage({
      type: 'invoke',
      data: {
        id,
        method,
        params: params || {}
      }
    });
  });
}
