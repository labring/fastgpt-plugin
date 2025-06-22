import { parentPort } from 'worker_threads';
import path from 'path';

const tools = [];
async function LoadTool(mod, filename) {
  const defaultToolId = filename.split('.').shift();
  const toolId = mod.toolId || defaultToolId;
  if (!mod.isToolSet) {
    tools.push({
      ...mod,
      toolId,
      toolFile: filename
    });
  } else {
    const children = mod.children;
    tools.push({
      ...mod,
      toolFile: filename,
      toolId,
      inputs: [],
      outputs: []
    });
    tools.push(...children.map((child) => ({ ...child, toolFile: filename })));
  }
}
const toolsDir = process.env.TOOLS_DIR || path.join(process.cwd(), 'dist', 'tools');

parentPort?.on('message', async ({ toolId, inputs, systemVar, filename }) => {
  const file = path.join(toolsDir, filename);
  const mod = (await import(file)).default;
  LoadTool(mod, filename);
  const tool = tools.find((tool) => tool.toolId === toolId);

  if (!tool || !tool.cb) {
    console.error(`Tool with ID ${toolId} not found or does not have a callback.`);
    parentPort.postMessage({
      type: 'error',
      error: new Error(`Tool with ID ${toolId} not found or does not have a callback.`)
    });
  }
  const result = await tool.cb(inputs, systemVar);

  parentPort.postMessage({
    type: 'success',
    data: result
  });
});
