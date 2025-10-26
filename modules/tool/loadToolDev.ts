import { isProd } from '@/constants';
import { addLog } from '@/utils/log';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path/posix';
import { basePath, devToolIds, UploadToolsS3Path } from './constants';
import type { ToolType, ToolSetType } from './type';
import { ToolTagEnum } from './type/tags';

/**
 * Load Tools in dev mode. Only avaliable in dev mode
 * @param filename
 */

export const LoadToolsDev = async (filename: string): Promise<ToolType[]> => {
  if (isProd) {
    addLog.error('Can not load dev tool in prod mode');
    return [];
  }

  const tools: ToolType[] = [];

  const toolPath = join(basePath, 'modules', 'tool', 'packages', filename);
  const rootMod = (await import(toolPath)).default as ToolSetType | ToolType;

  const childrenPath = join(toolPath, 'children');
  const isToolSet = existsSync(childrenPath);

  const toolsetId = rootMod.toolId || filename;

  if (isToolSet) {
    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: rootMod.icon ?? '',
      toolFilename: filename,
      cb: () => Promise.resolve({}),
      versionList: []
    });

    const children: ToolType[] = [];

    {
      const files = await readdir(childrenPath);
      for (const file of files) {
        const childPath = join(childrenPath, file);
        const childMod = (await import(childPath)).default as ToolType;
        const toolId = childMod.toolId || `${toolsetId}/${file}`;
        children.push({
          ...childMod,
          toolId,
          toolFilename: filename,
          icon: childMod.icon ?? ''
        });
      }
    }

    tools.push(...children);
  } else {
    // is not toolset
    tools.push({
      ...(rootMod as ToolType),
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: rootMod.icon ?? '',
      toolFilename: filename,
      versionList: []
    });
  }

  tools.forEach((tool) => devToolIds.add(tool.toolId));
  return tools;
};
