import { ensureDir } from '@/utils/fs';
import { join } from 'path';
import { autoToolIdPlugin } from './plugin';
import { cp } from 'fs/promises';
import { existsSync } from 'fs';
import { pkg } from '@/utils/zip';
import { readdir, rm } from 'fs/promises';

export const toolsSourceDir = join(__dirname, '..', 'packages');
const distDir = join(__dirname, '..', '..', '..', 'dist');
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

  // 2. move README.md, assets/*, and logos from any subdirectories into the cache dir
  if (existsSync(join(toolDir, 'README.md'))) {
    await cp(join(toolDir, 'README.md'), join(cacheDir, 'README.md'));
  }

  if (existsSync(join(toolDir, 'assets'))) {
    await cp(join(toolDir, 'assets'), join(cacheDir, 'assets'), { recursive: true });
  }

  // find and copy logo file from parent directory
  const files = await readdir(toolDir);
  let parentLogoFile: string | null = null;

  for (const file of files) {
    if (file.startsWith('logo.')) {
      await cp(join(toolDir, file), join(cacheDir, file));
      parentLogoFile = file;
    }
  }

  // Find and copy any logo files in subdirectories
  const childrenDir = join(toolDir, 'children');
  if (existsSync(childrenDir)) {
    const childDirs = await readdir(childrenDir, { withFileTypes: true }).then((dirents) =>
      dirents.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name)
    );

    for (const childDir of childDirs) {
      const childPath = join(childrenDir, childDir);
      const files = await readdir(childPath);
      let childHasLogo = false;

      // Check if child has its own logo
      for (const file of files) {
        if (file.startsWith('logo.')) {
          await cp(join(childPath, file), join(cacheDir, childDir, file));
          childHasLogo = true;
        }
      }

      // If child doesn't have logo but parent does, copy parent logo to child
      if (!childHasLogo && parentLogoFile) {
        await ensureDir(join(cacheDir, childDir));
        await cp(join(toolDir, parentLogoFile), join(cacheDir, childDir, parentLogoFile));
      }
    }
  }

  // 3. zip the cache dir into a .pkg file
  const res = await pkg(cacheDir, join(distDir, 'pkgs', toolDirname));

  // 4. clean the cache dir
  await rm(cacheDir, { recursive: true });

  console.log('build tool success', res);
}
