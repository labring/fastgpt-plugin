import { getCachedData } from '@/lib/cache';
import { SystemCacheKeyEnum } from '@/lib/cache/type';
import { mod } from '@/lib/logger';
import { privateS3Server } from '@/lib/s3';
import { ToolTagsNameMap } from '@fastgpt-plugin/helpers/index';
import type { ToolType } from '@fastgpt-plugin/helpers/tools/schemas/tool';
import { getLogger } from '@logtape/logtape';
import type z from 'zod';
import type { ToolTagListSchema, ToolTagEnum } from './schemas';
import { getErrText } from './utils/err';
import fs, { createWriteStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { rm } from 'node:fs/promises';

const logger = getLogger(mod.tool);

export async function getTool(toolId: string): Promise<ToolType | undefined> {
  const tools = await getCachedData(SystemCacheKeyEnum.systemTool);
  return tools.get(toolId) as ToolType;
}

export function getToolTags(): z.infer<typeof ToolTagListSchema> {
  return Object.entries(ToolTagsNameMap).map(([id, name]) => ({
    value: id as z.infer<typeof ToolTagEnum>,
    label: name.en
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
        logger.warn(`Download plugin file: ${objectName} from S3 error: ${getErrText(err)}`);
        return Promise.reject(err);
      }
    );
  } catch {
    await rm(filepath);
  }
}
