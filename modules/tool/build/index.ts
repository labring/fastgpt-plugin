import fs from 'fs/promises';
import { buildTool, toolsSourceDir } from './build';
import { join } from 'path';

const tool = process.argv[2] || '*';

export const buildAllTools = async () => {
  // read all tools, and build them
  const tools = await fs.readdir(toolsSourceDir);
  const promises: Promise<void>[] = [];
  for await (const tool of tools) {
    if (await fs.exists(join(toolsSourceDir, tool, 'index.ts'))) {
      promises.push(buildTool(tool));
    }
  }
  await Promise.all(promises);
};

if (import.meta.main) {
  if (tool === '*') {
    await buildAllTools();
  } else {
    await buildTool(tool);
  }
}
