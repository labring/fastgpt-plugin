import { addLog } from '@/utils/log';
import { $ } from 'bun';
import fs from 'fs';
import path from 'path';
import { copyToolIcons } from '../modules/tool/utils/icon';
import { autoToolIdPlugin } from './plugin';
import { exit } from 'process';

const toolsDir = path.join(__dirname, '..', 'modules', 'tool', 'packages');
const distDir = path.join(__dirname, '..', 'dist');
const distToolDir = path.join(distDir, 'tools');
const tools = fs.readdirSync(toolsDir);

export const buildATool = async (tool: string, dist: string = distToolDir) => {
  const filepath = path.join(toolsDir, tool);
  Bun.build({
    entrypoints: [filepath],
    outdir: dist,
    naming: tool + '.js',
    target: 'node',
    plugins: [autoToolIdPlugin],
    external: ['@tool/utils'],
    minify: true
  });
};

const workdir = process.cwd();

if (workdir.includes('modules/tool/packages')) {
  const tool = workdir.split('/').at(-1);
  if (tool) await buildATool(tool, path.join(workdir, 'dist'));
  console.log('build tool', tool);
  exit();
}

// main build
await $`bun run build:main`.quiet();
addLog.info('Main Build complete');
await $`bun run build:worker`.quiet();
addLog.info('Worker Build complete');

await Promise.all(tools.map((tool) => buildATool(tool)));
addLog.info('Tools Build complete');

// build @tool/utils/*
const utilsDir = path.join(__dirname, '..', 'modules', 'tool', 'utils');
Bun.build({
  entrypoints: fs.readdirSync(utilsDir).map((f) => path.join(utilsDir, f)),
  outdir: path.join(distDir, 'node_modules', '@tool', 'utils'),
  naming: '[name]',
  target: 'node',
  minify: true
});

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
