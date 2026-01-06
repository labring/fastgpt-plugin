import { isProd } from '@/constants';
import { addLog } from '@/utils/log';
import { basePath, devToolIds } from '@tool/constants';
import { ToolTagEnum } from '@tool/type/tags';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { generateToolVersion, generateToolSetVersion } from '@tool/utils/tool';
import { toolsDir } from '@tool/constants';
import type { ToolSetType, ToolType } from '@tool/type';
import { stat } from 'fs/promises';

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
  const parentIcon = rootMod.icon;

  if (isToolSet) {
    const children: ToolType[] = [];

    {
      const files = await readdir(childrenPath);
      for (const file of files) {
        const childPath = join(childrenPath, file);

        const childMod = (await import(childPath)).default as ToolType;
        const toolId = childMod.toolId || `${toolsetId}/${file}`;

        const childIcon = childMod.icon ?? rootMod.icon;

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
    const icon = rootMod.icon;

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

export const parseMod = async ({
  rootMod,
  filename,
  temp = false
}: {
  rootMod: ToolSetType | ToolType;
  filename: string;
  temp?: boolean;
}) => {
  const tools: ToolType[] = [];
  const checkRootModToolSet = (rootMod: ToolType | ToolSetType): rootMod is ToolSetType => {
    return 'children' in rootMod;
  };
  if (checkRootModToolSet(rootMod)) {
    const toolsetId = rootMod.toolId;

    const parentIcon = rootMod.icon;

    const children = rootMod.children;

    for (const child of children) {
      const childToolId = child.toolId;

      const childIcon = child.icon || rootMod.icon;

      // Generate version for child tool
      const childVersion = generateToolVersion(child.versionList);
      tools.push({
        ...child,
        toolId: childToolId,
        parentId: toolsetId,
        tags: rootMod.tags,
        courseUrl: rootMod.courseUrl,
        author: rootMod.author,
        icon: childIcon,
        toolFilename: filename,
        version: childVersion
      });
    }

    // push parent
    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: parentIcon,
      toolFilename: `${filename}`,
      cb: () => Promise.resolve({}),
      versionList: [],
      version: generateToolSetVersion(children) || ''
    });
  } else {
    // is not toolset
    const toolId = rootMod.toolId;

    const icon = rootMod.icon;

    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.tools],
      icon,
      toolId,
      toolFilename: filename,
      version: generateToolVersion(rootMod.versionList)
    });
  }
  return tools;
};

export const loadTool = async (filename: string, dev: boolean) => {
  return dev ? await LoadToolsDev(filename) : await LoadToolsByFilename(filename);
};
