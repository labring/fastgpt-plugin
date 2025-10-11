import { mkdir, exists, unlink } from 'fs/promises';
import { addLog } from './log';
import { getErrText } from '@tool/utils/err';

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
