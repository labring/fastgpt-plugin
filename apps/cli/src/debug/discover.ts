import fs from 'node:fs/promises';
import path from 'node:path';

const IGNORED_DIRS = new Set([
  '.build',
  '.fastgpt-plugin-debug',
  '.git',
  '.turbo',
  '.vite',
  'coverage',
  'dist',
  'node_modules',
  '__pack_output__'
]);

export async function discoverDebugEntries(cwd = process.cwd()): Promise<string[]> {
  const root = path.resolve(cwd);
  if (await hasIndexFile(root)) {
    return [root];
  }

  const children = await fs.readdir(root, { withFileTypes: true });
  const entries: string[] = [];

  for (const child of children) {
    if (!child.isDirectory() || IGNORED_DIRS.has(child.name)) {
      continue;
    }

    const candidate = path.join(root, child.name);
    if (await hasIndexFile(candidate)) {
      entries.push(candidate);
    }
  }

  entries.sort();

  if (entries.length === 0) {
    throw new Error(`当前目录未发现可调试插件，请传入插件目录或在当前目录下放置 index.ts。`);
  }

  return entries;
}

async function hasIndexFile(dir: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path.join(dir, 'index.ts'));
    return stat.isFile();
  } catch {
    return false;
  }
}
