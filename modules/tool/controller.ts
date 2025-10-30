import { ToolTagEnum, ToolTagsNameMap } from './type/tags';
import z from 'zod';
import { ToolTagListSchema } from './type/api';
import type { ToolType } from './type';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import * as fs from 'fs';
import path from 'path';
import { addLog } from '@/utils/log';
import { getErrText } from './utils/err';
import { privateS3Server } from '@/s3';
import { removeFile } from '@/utils/fs';
import { getCachedData } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';

export async function getTool(toolId: string): Promise<ToolType | undefined> {
  const tools = await getCachedData(SystemCacheKeyEnum.systemTool);
  return tools.get(toolId);
}

export function getToolTags(): z.infer<typeof ToolTagListSchema> {
  return Object.entries(ToolTagsNameMap).map(([id, name]) => ({
    id: id as z.infer<typeof ToolTagEnum>,
    name
  }));
}

export async function downloadTool(objectName: string, uploadPath: string) {
  const filename = objectName.split('/').pop() as string;

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const filepath = path.join(uploadPath, filename);

  try {
    await pipeline(await privateS3Server.getFile(objectName), createWriteStream(filepath)).catch(
      (err: any) => {
        addLog.warn(`Download plugin file: ${objectName} from S3 error: ${getErrText(err)}`);
        return Promise.reject(err);
      }
    );
  } catch {
    await removeFile(filepath);
  }
}
