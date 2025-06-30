import { addLog } from '@/utils/log';
import { $ } from 'bun';
import fs from 'fs';
import path from 'path';
import { copyToolIcons } from '../packages/tool/utils/icon';
import { autoToolIdPlugin } from './plugin';

// Delete dist
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
  addLog.info('Cleaned dist directory');
}

// main build
await $`bun run build:main`.quiet();
addLog.info('Main Build complete');
await $`bun run build:worker`.quiet();
addLog.info('Worker Build complete');

const buildATool = async (tool: string) => {
  const filepath = path.join(toolsDir, tool);
  const distDir = path.join(__dirname, '..', 'dist', 'tools', tool);
  await Bun.build({
    entrypoints: [filepath],
    outdir: distDir,
    naming: 'index.js',
    target: 'node'
  });

  const childrenPath = path.join(filepath, 'children');
  if (fs.existsSync(childrenPath)) {
    const children = fs.readdirSync(childrenPath);
    await Promise.all(
      children.map(async (child) => {
        const childPath = path.join(childrenPath, child);
        const childDistDir = path.join(distDir, 'children');
        await Bun.build({
          entrypoints: [childPath],
          outdir: childDistDir,
          naming: child + '.js',
          target: 'node'
        });
      })
    );
  }
};
const toolsDir = path.join(__dirname, '..', 'packages', 'tool', 'packages');
const tools = fs.readdirSync(toolsDir);
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
