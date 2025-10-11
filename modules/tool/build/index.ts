import fs from 'fs/promises';
import { buildTool, toolsSourceDir } from './build';
import { join } from 'path';
import { isProd } from '@/constants';

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

if (!isProd) {
  await buildAllTools();
}
