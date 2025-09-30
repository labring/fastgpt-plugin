import { isProd } from '@/constants';
import { copyIcons } from 'modules/tool/utils/icon';
import path from 'path';
import { DevServer } from './devServer';
import fs from 'fs/promises';

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

async function checkToolDir() {
  const toolsDir = path.join(__dirname, '..', 'modules', 'tool', 'packages');

  try {
    const entries = await fs.readdir(toolsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const dirPath = path.join(toolsDir, entry.name);
      const indexPath = path.join(dirPath, 'index.ts');

      try {
        await fs.access(indexPath);
      } catch {
        // index.ts doesn't exist, remove the directory
        await fs.rm(dirPath, { recursive: true, force: true });
        console.log(`Removed tool directory without index.ts: ${entry.name}`);
      }
    }
  } catch (error) {
    console.error('Error checking tool directories:', error);
  }
}

await copyDevIcons();
await checkToolDir();

const server = new DevServer();
await server.start();
