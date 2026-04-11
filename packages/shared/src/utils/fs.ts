import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';

/**
 * Ensure a directory exists
 * @param path
 */
export const ensureDir = async (path: string) => {
  if (!existsSync(path)) {
    await mkdir(path, { recursive: true });
  }
};

/**
 * remove the dir and then create a new one
 */
export async function refreshDir(dir: string) {
  await rm(dir, { recursive: true, force: true });
  await ensureDir(dir);
}
