import { parentPort } from 'worker_threads';
import type { Main2WorkerMessageType } from './type';
import { setupProxy } from '../utils/setupProxy';
import { LoadToolsByFilename } from '@tool/utils';
import { getErrText } from '@tool/utils/err';
import { LoadToolsDev } from '@tool/loadToolDev';
import type { ToolCallbackReturnSchemaType } from '@tool/type/req';

setupProxy();

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
      const tools = data.dev
        ? await LoadToolsDev(data.filename)
        : await LoadToolsByFilename(data.filename);

      const tool = tools.find((tool) => tool.toolId === data.toolId);

      if (!tool || !tool.cb) {
        parentPort?.postMessage({
          type: 'done',
          data: {
            error: `Tool with ID ${data.toolId} not found or does not have a callback.`
          }
        });
        return;
      }

      try {
        // callback function
        const sendMessage = (messageData: any) => {
          parentPort?.postMessage({
            type: 'stream',
            data: messageData
          });
        };

        // sendMessage is optinal
        const result: ToolCallbackReturnSchemaType = await tool.cb(data.inputs, {
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
  }
});
