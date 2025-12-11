import { toolsDir } from './constants';
import type { ToolSetType, ToolType } from './type';
import { addLog } from '@/utils/log';
import { join } from 'path';
import { parseMod } from './parseMod';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';

// Load tool or toolset and its children
export const LoadToolsByFilename = async (filename: string): Promise<ToolType[]> => {
  const filePath = join(toolsDir, filename);

  // Calculate file content hash for cache key
  // Same content = same hash = reuse cache, reducing memory usage
  const fileContent = await readFile(filePath);
  const contentHash = createHash('md5').update(fileContent).digest('hex').slice(0, 8);

  // Clear module cache in Node.js to prevent memory leaks
  // @ts-ignore - require.cache only exists in Node.js, not in Bun
  if (typeof require !== 'undefined' && require.cache) {
    // Try to delete cache entries (works for CJS modules)
    delete require.cache[filePath];
    delete require.cache[require.resolve?.(filePath) || filePath];
  }

  // Use content hash as cache buster (works for ESM in both Node.js and Bun)
  // This ensures same content reuses the same cached module
  const modulePath = `${filePath}?v=${contentHash}`;

  const rootMod = (await import(modulePath)).default as ToolType | ToolSetType;

  if (!rootMod.toolId) {
    addLog.error(`Can not parse toolId, filename: ${filename}`);
    return [];
  }

  return parseMod({ rootMod, filename });
};
