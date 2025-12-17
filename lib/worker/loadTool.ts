import { isProd } from '@/constants';
import { addLog } from '@/utils/log';
import { basePath, devToolIds } from '@tool/constants';
import { LoadToolsByFilename } from '@tool/loadToolProd';
import { getIconPath } from '@tool/parseMod';
import type { ToolSetType, ToolType } from '@tool/type';
import { ToolTagEnum } from '@tool/type/tags';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { generateToolVersion, generateToolSetVersion } from '@tool/utils/tool';

const LoadToolsDev = async (filename: string): Promise<ToolType[]> => {
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
  const parentIcon = rootMod.icon ?? getIconPath(`${toolsetId}/logo`);

  if (isToolSet) {
    const children: ToolType[] = [];

    {
      const files = await readdir(childrenPath);
      for (const file of files) {
        const childPath = join(childrenPath, file);

        const childMod = (await import(childPath)).default as ToolType;
        const toolId = childMod.toolId || `${toolsetId}/${file}`;

        const childIcon = childMod.icon ?? rootMod.icon ?? getIconPath(`${toolsetId}/${file}/logo`);

        // Generate version for child tool
        const childVersion = childMod.versionList
          ? generateToolVersion(childMod.versionList)
          : generateToolVersion([]);

        children.push({
          ...childMod,
          toolId,
          toolFilename: filename,
          icon: childIcon,
          parentId: toolsetId,
          version: childVersion
        });
      }
    }

    // Generate version for tool set based on children
    const toolSetVersion = generateToolSetVersion(children) ?? '';

    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: parentIcon,
      toolFilename: filename,
      cb: () => Promise.resolve({}),
      versionList: [],
      version: toolSetVersion
    });
    tools.push(...children);
  } else {
    // is not toolset
    const icon = rootMod.icon ?? getIconPath(`${toolsetId}/logo`);

    // Generate version for single tool
    const toolVersion = (rootMod as any).versionList
      ? generateToolVersion((rootMod as any).versionList)
      : generateToolVersion([]);
    tools.push({
      ...(rootMod as ToolType),
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon,
      toolFilename: filename,
      version: toolVersion
    });
  }

  tools.forEach((tool) => devToolIds.add(tool.toolId));
  return tools;
};

export const loadTool = async (filename: string, dev: boolean) => {
  return dev ? await LoadToolsDev(filename) : await LoadToolsByFilename(filename);
};
