import { toolsDir } from './constants';
import type { ToolSetType, ToolType } from './type';
import { addLog } from '@/utils/log';
import { join } from 'path';
import { parseMod } from './parseMod';
import { stat } from 'fs/promises';

// Load tool or toolset and its children
export const LoadToolsByFilename = async (filename: string): Promise<ToolType[]> => {
  const start = Date.now();

  const filePath = join(toolsDir, filename);

  // Calculate file content hash for cache key
  const fileSize = await stat(filePath).then((res) => res.size);
  // This ensures same content reuses the same cached module
  const modulePath = `${filePath}?v=${fileSize}`;

  const rootMod = (await import(modulePath)).default as ToolType | ToolSetType;

  if (!rootMod.toolId) {
    addLog.error(`Can not parse toolId, filename: ${filename}`);
    return [];
  }

  addLog.debug(`Load tool ${filename} finish, time: ${Date.now() - start}ms`);

  return parseMod({ rootMod, filename });
};
