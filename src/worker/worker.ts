import { parentPort } from 'worker_threads';
import path from 'path';
import { LoadToolsByFilename } from '@tool/init';
import { isProd } from '@/constants';
import { getErrText } from '@tool/utils/err';
import type { Main2WorkerMessageType } from './type';

// rewrite console.log to send to parent
console.log = (...args: any[]) => {
  parentPort?.postMessage({
    type: 'log',
    data: args
  });
};

const basePath = isProd
  ? process.env.TOOLS_DIR || path.join(process.cwd(), 'dist', 'tools')
  : path.join(process.cwd(), 'modules', 'tool', 'packages');

parentPort?.on('message', async (params: Main2WorkerMessageType) => {
  const { type, data } = params;
  switch (type) {
    case 'runTool': {
      // Extract toolSource and filename from toolDirName (format: "toolSource/filename")
      const [toolSource, filename] = data.toolDirName.split('/') as [
        'uploaded' | 'built-in',
        string
      ];

      const tools = await LoadToolsByFilename(basePath, filename, toolSource);

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
        const result = await tool.cb(data.inputs, {
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
      global.uploadFileResponseFn?.(data);
      break;
    }
  }
});
