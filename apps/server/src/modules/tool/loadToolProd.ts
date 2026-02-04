import { toolsDir } from './constants';
import { getLogger, mod } from '@/lib/logger';
import { join } from 'path';
import { stat } from 'fs/promises';
import type { UnifiedToolType } from '@fastgpt-plugin/helpers/tools/schemas/tool';

const logger = getLogger(mod.tool);
// Load tool or toolset and its children
export const LoadToolsByFilename = async (filename: string): Promise<UnifiedToolType[]> => {
  const start = Date.now();

  const filePath = join(toolsDir, filename);

  // Calculate file content hash for cache key
  const fileSize = await stat(filePath).then((res) => res.size);
  // This ensures same content reuses the same cached module
  const modulePath = `${filePath}?v=${fileSize}`;

  const rootMod = (await import(modulePath)).default as UnifiedToolType;

  if (!rootMod.toolId) {
    logger.error(`Can not parse toolId, filename: ${filename}`);
    return [];
  }

  logger.debug(`Load tool ${filename} finish, time: ${Date.now() - start}ms`);

  return parseMod({ rootMod, filename });
};
