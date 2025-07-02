import { addLog } from '@/utils/log';
import { $ } from 'bun';
import fs from 'fs';
import path from 'path';
import { copyToolIcons } from '../modules/tool/utils/icon';
import { autoToolIdPlugin } from './plugin';

// main build

await $`bun run build:main`.quiet();
addLog.info('Main Build complete');
await $`bun run build:worker`.quiet();
addLog.info('Worker Build complete');

const toolsDir = path.join(__dirname, '..', 'modules', 'tool', 'packages');
const distDir = path.join(__dirname, '..', 'dist', 'tools');
const tools = fs.readdirSync(toolsDir);

const buildATool = async (tool: string) => {
  const filepath = path.join(toolsDir, tool);
  Bun.build({
    entrypoints: [filepath],
    outdir: distDir,
    naming: tool + '.js',
    target: 'node',
    plugins: [autoToolIdPlugin]
  });
};

await Promise.all(tools.map(buildATool));
addLog.info('Tools Build complete');

const publicImgsDir = path.join(__dirname, '..', 'dist', 'public', 'imgs', 'tools');
const copiedCount = await copyToolIcons({
  toolsDir,
  targetDir: publicImgsDir,
  tools,
  logPrefix: 'Copied build icon'
});

addLog.info(
  `Tools Build complete, total toolset/tool: ${tools.length}, icons copied: ${copiedCount}`
);
