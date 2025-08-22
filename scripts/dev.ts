import { isProd } from '@/constants';
import { copyToolIcons } from 'modules/tool/utils/icon';
import path from 'path';
import { watch } from 'fs/promises';
import { $ } from 'bun';
import { addLog } from '@/utils/log';

async function copyDevIcons() {
  if (isProd) return;

  const toolsDir = path.join(__dirname, '..', 'modules', 'tool', 'packages');
  const publicImgsToolsDir = path.join(__dirname, '..', 'public', 'imgs', 'tools');
  const modelsDir = path.join(__dirname, '..', 'modules', 'model', 'provider');
  const publicImgsModelsDir = path.join(__dirname, '..', 'public', 'imgs', 'models');

  // Copy tool and model icons in parallel
  await Promise.all([
    copyToolIcons({
      sourceDir: toolsDir,
      targetDir: publicImgsToolsDir,
      logPrefix: 'Copied dev tool icon'
    }),
    copyToolIcons({
      sourceDir: modelsDir,
      targetDir: publicImgsModelsDir,
      logPrefix: 'Copied dev model icon'
    })
  ]);
}
await copyDevIcons();

// watch the worker.ts change and build it
const workerPath = path.join(__dirname, '..', 'src', 'worker', 'worker.ts');
const watcher = watch(workerPath);

(async () => {
  for await (const _ of watcher) {
    addLog.debug(`Worker file changed, rebuilding...`);
    await $`bun run build:worker`;
  }
})();

// build the worker
await $`bun run build:worker`;
// run the main server
await $`bun run --hot src/index.ts`;
