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
  : path.join(process.cwd(), 'packages', 'tool', 'packages');

parentPort?.on('message', async (params: Main2WorkerMessageType) => {
  const { type, data } = params;
  switch (type) {
    case 'runTool': {
      const tools = await LoadToolsByFilename(basePath, data.toolDirName);

      const tool = tools.find((tool) => tool.toolId === data.toolId);

      if (!tool || !tool.cb) {
        parentPort?.postMessage({
          type: 'error',
          data: `Tool with ID ${data.toolId} not found or does not have a callback.`
        });
      }
      try {
        const result = await tool?.cb(data.inputs, data.systemVar);
        parentPort?.postMessage({
          type: 'success',
          data: result
        });
      } catch (error) {
        parentPort?.postMessage({
          type: 'error',
          data: getErrText(error)
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
