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
const tools = fs.readdirSync(toolsDir).filter((item) => !['.DS_Store'].includes(item));
export const buildATool = async (tool: string, dist: string = distToolDir) => {
  const filepath = path.join(toolsDir, tool);
  Bun.build({
    entrypoints: [filepath],
    outdir: dist,
    naming: tool + '.js',
    target: 'node',
    plugins: [autoToolIdPlugin],
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

// copy tool and model icons to dist in parallel
const publicImgsToolsDir = path.join(__dirname, '..', 'dist', 'public', 'imgs', 'tools');
const modelsDir = path.join(__dirname, '..', 'modules', 'model', 'provider');
const publicImgsModelsDir = path.join(__dirname, '..', 'dist', 'public', 'imgs', 'models');

const [copiedToolsCount, copiedModelsCount] = await Promise.all([
  copyToolIcons({
    sourceDir: toolsDir,
    targetDir: publicImgsToolsDir,
    items: tools,
    logPrefix: 'Copied build tool icon'
  }),
  copyToolIcons({
    sourceDir: modelsDir,
    targetDir: publicImgsModelsDir,
    logPrefix: 'Copied build model icon'
  })
]);

addLog.info(
  `Tools Build complete, total toolset/tool: ${tools.length}, tool icons copied: ${copiedToolsCount}, model icons copied: ${copiedModelsCount}`
);
