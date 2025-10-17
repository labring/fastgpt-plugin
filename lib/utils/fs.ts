import { mkdir, exists, unlink } from 'fs/promises';
import { addLog } from './log';
import { getErrText } from '@tool/utils/err';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { pluginFileS3Server } from '@/s3';
import { createWriteStream } from 'fs';

export const ensureDir = async (path: string) => {
  if (!(await exists(path))) {
    await mkdir(path, { recursive: true });
  }
};

export const removeFile = async (file: string) => {
  try {
    if (await exists(file)) {
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
