import { isProd } from '@/constants';
import { copyIcons } from 'modules/tool/utils/icon';
import path from 'path';
import { watch } from 'fs/promises';
import { $ } from 'bun';
import { addLog } from '@/utils/log';
import { DevServer } from './devServer';

async function copyDevIcons() {
  if (isProd) return;

  const toolsDir = path.join(__dirname, '..', 'modules', 'tool', 'packages');
  const publicImgsToolsDir = path.join(__dirname, '..', 'public', 'imgs', 'tools');
  const modelsDir = path.join(__dirname, '..', 'modules', 'model', 'provider');
  const publicImgsModelsDir = path.join(__dirname, '..', 'public', 'imgs', 'models');

  // Copy tool and model icons in parallel
  await Promise.all([
    copyIcons({
      sourceDir: toolsDir,
      targetDir: publicImgsToolsDir,
      logPrefix: 'Copied dev tool icon'
    }),
    copyIcons({
      sourceDir: modelsDir,
      targetDir: publicImgsModelsDir,
      logPrefix: 'Copied dev model icon'
    })
  ]);
}
await copyDevIcons();

// watch the worker.ts change and build it

// (async () => {
//   const watcher = watch(path.join(__dirname, '..', 'src', 'worker', 'worker.ts'));
//   for await (const _event of watcher) {
//     addLog.debug(`Worker file changed, rebuilding...`);
//   }
// })();

// build the worker
// await $`bun run build:worker`;
// run the main server
// (async () => {
//   const watcher = watch(path.join(__dirname, '..', 'src'));
//   for await (const _event of watcher) {
//     addLog.debug(`Worker file changed, rebuilding...`);
//     // rerun the server
//     await $`bun run build:worker`;
//     await $`bun run src/index.ts`;
//   }
// })();

const server = new DevServer();
await server.start();
