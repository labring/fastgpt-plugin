import { ensureDir } from '@/utils/fs';
import { join } from 'path';
import { autoToolIdPlugin } from './plugin';
import { cp, exists } from 'fs/promises';
import { pkg } from '@/utils/zip';

export const toolsSourceDir = join(__dirname, '..', 'packages');
const distDir = join(__dirname, '..', 'dist');
await ensureDir(distDir);
await ensureDir(join(distDir, 'pkgs'));

/**
 build a tool into a pkg file, which is simply a .zip format file.
 */
export async function buildTool(toolDirname: string) {
  // 0. make middle cache dir in dist/.cache
  const toolDir = join(toolsSourceDir, toolDirname);
  const cacheDir = join(__dirname, '..', 'dist', '.cache', toolDirname);
  await ensureDir(cacheDir);

  // 1. build ts into single index.js file
  await Bun.build({
    entrypoints: [join(toolDir, 'index.ts')],
    outdir: cacheDir,
    target: 'node',
    plugins: [autoToolIdPlugin],
    naming: 'index.js',
    minify: true
  });

  // 2. move README.md, assets/* into the cache dir
  if (await exists(join(toolDir, 'README.md'))) {
    await cp(join(toolDir, 'README.md'), join(cacheDir, 'README.md'));
  }

  if (await exists(join(toolDir, 'assets'))) {
    await cp(join(toolDir, 'assets'), join(cacheDir, 'assets'), { recursive: true });
  }

  // 3. zip the cache dir into a .pkg file
  const res = await pkg(cacheDir, join(distDir, 'pkgs', toolDirname));
  console.log('build tool success', res);
}
