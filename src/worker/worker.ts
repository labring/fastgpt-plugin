import { parentPort } from 'worker_threads';
import path from 'path';
import { LoadToolsByFilename } from '@tool/init';
import { isProd } from '@/constants';
import { getErrText } from '@tool/utils/err';
import type { Main2WorkerMessageType } from './type';

// rewrite console.debug to send to parent
console.debug = (...args: any[]) => {
  parentPort?.postMessage({
    type: 'log',
    data: {
      type: 'debug',
      args: args
    }
  });
};

// rewrite console.log to send to parent
console.log = (...args: any[]) => {
  parentPort?.postMessage({
    type: 'log',
    data: {
      type: 'info',
      args: args
    }
  });
};

console.warn = (...args: any[]) => {
  parentPort?.postMessage({
    type: 'log',
    data: {
      type: 'warn',
      args: args
    }
  });
};

// rewrite console.error to send to parent
console.error = (...args: any[]) => {
  parentPort?.postMessage({
    type: 'log',
    data: {
      type: 'error',
      args: args
    }
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
        const result = tool?.cb(data.inputs, data.systemVar);

        parentPort?.postMessage({
          type: 'success',
          data: result
        });
      } catch (error) {
        // TODO: 处理错误
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

// parentPort?.on(
//   'message',
//   async ({
//     toolId,
//     inputs,
//     systemVar,
//     toolDirName
//   }: {
//     toolId: string;
//     inputs: Record<string, any>;
//     systemVar: SystemVarType;
//     toolDirName: string;
//   }) => {
//     const tools = await LoadToolsByFilename(basePath, toolDirName);
//     const tool = tools.find((tool) => tool.toolId === toolId);

//     if (!tool || !tool.cb) {
//       parentPort?.postMessage({
//         type: 'error',
//         data: `Tool with ID ${toolId} not found or does not have a callback.`
//       });
//     }
//     try {
//       const result = await tool?.cb(inputs, systemVar);

//       parentPort?.postMessage({
//         type: 'success',
//         data: result
//       });
//     } catch (error) {
//       parentPort?.postMessage({
//         type: 'error',
//         data: getErrText(error)
//       });
//     }
//   }
// );
