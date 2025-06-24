import { parentPort } from 'worker_threads';
import path from 'path';
import type { ToolSetType, ToolType } from '@tool/type';
import { tools } from '@tool/constants';

// rewrite console.log to send to parent
console.log = (...args: any[]) => {
  parentPort?.postMessage({
    type: 'log',
    data: args
  });
};

const LoadTool = (mod: ToolType | ToolSetType, filename: string) => {
  const defaultToolId = filename.split('.').shift() as string;
  const toolId = mod.toolId || defaultToolId;
  if (!mod.isToolSet) {
    tools.push({
      ...mod,
      toolId,
      toolFile: filename
    } as ToolType);
  } else {
    const children = (mod as ToolSetType).children as ToolType[];
    tools.push({
      ...mod,
      toolFile: filename,
      toolId,
      inputs: [],
      outputs: []
    } as ToolType);
    tools.push(...children.map((child) => ({ ...child, toolFile: filename })));
  }
};

const toolsDir = process.env.TOOLS_DIR || path.join(process.cwd(), 'dist', 'tools');

parentPort?.on('message', async ({ toolId, inputs, systemVar, filename }) => {
  const file = path.join(toolsDir, filename);
  const mod = (await import(file)).default;
  LoadTool(mod, filename);
  const tool = tools.find((tool) => tool.toolId === toolId);

  if (!tool || !tool.cb) {
    console.error(`Tool with ID ${toolId} not found or does not have a callback.`);
    parentPort?.postMessage({
      type: 'error',
      error: new Error(`Tool with ID ${toolId} not found or does not have a callback.`)
    });
  }
  const result = await tool?.cb(inputs, systemVar);

  parentPort?.postMessage({
    type: 'success',
    data: result
  });
});
