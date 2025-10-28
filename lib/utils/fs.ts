import { mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { addLog } from './log';
import { getErrText } from '@tool/utils/err';
import { rm } from 'fs/promises';
import { move } from 'fs-extra';
import { tempDir } from '@tool/constants';

export const ensureDir = async (path: string) => {
  if (!existsSync(path)) {
    await mkdir(path, { recursive: true });
  }
};

export const removeFile = async (file: string) => {
  try {
    if (existsSync(file)) {
      await unlink(file);
    }
  } catch (err) {
    addLog.warn(`delele File Error, ${getErrText(err)}`);
  }
};

export async function moveDir(src: string, dest: string) {
  // use rename to move the dir
  // 1. clean the dest
  // 2. rename the src
  try {
    await rm(dest, { recursive: true, force: true });
  } catch {
    // do nothing
  }
  await move(src, dest);
  // // 3. make the dirs
  // await ensureDir(parse(dest).dir);
  // await rename(src, dest);
}

export async function cleanTempDir() {
  await rm(tempDir, { recursive: true, force: true });
  await ensureDir(tempDir);
}
/**
 * remove the dir and then create a new one
 */
export async function refreshDir(dir: string) {
  await rm(dir, { recursive: true, force: true });
  await ensureDir(dir);
}
