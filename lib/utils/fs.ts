import { mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { addLog } from './log';
import { getErrText } from '@tool/utils/err';
import { join, parse } from 'path';
import { pipeline } from 'stream/promises';
import { pluginFileS3Server } from '@/s3';
import { createWriteStream } from 'fs';
import { rm } from 'fs/promises';
import { rename } from 'fs/promises';
import { move } from 'fs-extra';

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

/**
 * Just download the file from minio whose name is objectName to specified download path.
 * @returns downloaded path
 */
export async function downloadFile(objectName: string, downloadPath: string) {
  const filename = objectName.split('/').pop() as string;
  await ensureDir(downloadPath);

  const filepath = join(downloadPath, filename);

  try {
    await pipeline(await pluginFileS3Server.getFile(objectName), createWriteStream(filepath)).catch(
      (err: any) => {
        addLog.warn(`Download plugin file: ${objectName} from S3 error: ${getErrText(err)}`);
        return Promise.reject(err);
      }
    );
    return filepath;
  } catch {
    await removeFile(filepath);
    return false;
  }
}

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
