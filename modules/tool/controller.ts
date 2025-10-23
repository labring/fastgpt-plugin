import { ToolTypeEnum } from './type/tool';
import { ToolTypeMap } from './type/tool';
import z from 'zod';
import { ToolTypeListSchema } from './type/api';
import type { ToolType } from './type';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import * as fs from 'fs';
import path from 'path';
import { addLog } from '@/utils/log';
import { getErrText } from './utils/err';
import { pluginFileS3Server } from '@/s3';
import { removeFile } from '@/utils/fs';
import { getCachedData } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';

export async function getTool(toolId: string): Promise<ToolType | undefined> {
  const tools = await getCachedData(SystemCacheKeyEnum.systemTool);
  return tools.get(toolId);
}

export function getToolType(): z.infer<typeof ToolTypeListSchema> {
  return Object.entries(ToolTypeMap).map(([type, name]) => ({
    type: type as ToolTypeEnum,
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
    await pipeline(await pluginFileS3Server.getFile(objectName), createWriteStream(filepath)).catch(
      (err: any) => {
        addLog.warn(`Download plugin file: ${objectName} from S3 error: ${getErrText(err)}`);
        return Promise.reject(err);
      }
    );
  } catch {
    await removeFile(filepath);
  }
}
