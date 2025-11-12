import { toolsDir } from './constants';
import type { ToolSetType, ToolType } from './type';
import { addLog } from '@/utils/log';
import { join } from 'path';
import { parseMod } from './parseMod';

// Load tool or toolset and its children
export const LoadToolsByFilename = async (filename: string): Promise<ToolType[]> => {
  const rootMod = (await import(join(toolsDir, filename))).default as ToolType | ToolSetType;

  if (!rootMod.toolId) {
    addLog.error(`Can not parse toolId, filename: ${filename}`);
    return [];
  }

  return parseMod({ rootMod, filename });
};
