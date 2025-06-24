import { addLog } from '@/utils/log';
import { $ } from 'bun';
import fs from 'fs';
import path from 'path';

// main build
await $`bun run build:main`.quiet();
addLog.info('Main Build complete');
await $`bun run build:worker`.quiet();
addLog.info('Worker Build complete');

// Build tools
const toolsDir = path.join(__dirname, '..', 'packages', 'tool', 'packages');
const tools = fs.readdirSync(toolsDir);
await Promise.all(tools.map((tool) => $`bun --cwd=${toolsDir}/${tool} run build`.quiet()));

async function moveTool(tool: string) {
  const src = path.join(toolsDir, tool, 'dist', 'index.js');
  const targetDir = path.join(__dirname, '..', 'dist', 'tools');
  const targetFile = path.join(targetDir, `${tool}.js`);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
  }

  fs.cpSync(src, targetFile);
}
await Promise.all(tools.map((tool) => moveTool(tool)));

addLog.info(`Tools Build complete, total files: ${tools.length}`);
