import { getErrText } from '@/modules/tool/utils/err';
import { configureProxy } from '@/utils/setup-proxy';
import { loadTool } from '@/utils/worker/loadTool';
import type { Main2WorkerMessageType } from '@/utils/worker/type';
import { parentPort } from 'worker_threads';

configureProxy();

declare global {
  var currentToolPrefix: string | undefined;
}

global.currentToolPrefix = undefined;

// rewrite console.log to send to parent
console.log = (...args: any[]) => {
  parentPort?.postMessage({
    type: 'log',
    data: args
  });
};

parentPort?.on('message', async (params: Main2WorkerMessageType) => {
  const { type, data } = params;
  switch (type) {
    case 'runTool': {
      const tool = (await loadTool(data.filename, data.dev)).find(
        (tool) => tool.toolId === data.toolId
      );

      if (!tool || !tool.handler) {
        parentPort?.postMessage({
          type: 'done',
          data: {
            error: `Tool with ID ${data.toolId} not found or does not have a callback.`
          }
        });
        return;
      }

      global.currentToolPrefix = data.systemVar?.tool?.prefix;

      try {
        // callback function
        const sendMessage = (messageData: any) => {
          parentPort?.postMessage({
            type: 'stream',
            data: messageData
          });
        };

        // sendMessage is optinal
        const result = await tool.handler(data.inputs, {
          systemVar: data.systemVar,
          streamResponse: sendMessage
        });

        if (result.error && result.error instanceof Error) {
          result.error = getErrText(result.error.message);
        }

        parentPort?.postMessage({
          type: 'done',
          data: result
        });
      } catch (error) {
        parentPort?.postMessage({
          type: 'done',
          data: {
            error: error instanceof Error ? getErrText(error) : error
          }
        });
      } finally {
        global.currentToolPrefix = undefined;
      }

      break;
    }
    case 'uploadFileResponse': {
      const fn = global.uploadFileResponseFnMap.get(data.id);
      if (fn) {
        fn(data);
      }
      break;
    }
    case 'invokeResponse': {
      const fn = global.invokeResponseFnMap?.get(data.id);
      if (fn) {
        fn(data);
      }
      break;
    }
  }
});
