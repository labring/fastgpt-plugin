// TODO: refactor this file
import { isProd } from '@/constants';
import { mod } from '@/lib/logger';
import { basePath, devToolIds, toolsDir } from '@/modules/tool/constants';
import { ToolTagEnum } from '@fastgpt-plugin/helpers/index';
import type { ToolType, ToolSetType } from '@fastgpt-plugin/helpers/tools/schemas/tool';
import { getLogger } from '@logtape/logtape';
import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const logger = getLogger(mod.tool);

const LoadToolsDev = async (filename: string): Promise<ToolType[]> => {
  if (isProd) {
    logger.error(`Can not load dev tool in prod mode`);
    return [];
  }

  const tools: ToolType[] = [];

  const toolPath = path.join(basePath, 'modules', 'tool', 'packages', filename);

  const rootMod = (await import(toolPath)).default as ToolSetType | ToolType;

  const childrenPath = path.join(toolPath, 'children');
  const isToolSet = existsSync(childrenPath);

  const toolsetId = rootMod.toolId || filename;
  const parentIcon = rootMod.icon;

  if (isToolSet) {
    const children: ToolType[] = [];

    {
      const files = await readdir(childrenPath);
      for (const file of files) {
        const childPath = path.join(childrenPath, file);

        const childMod = (await import(childPath)).default as ToolType;
        const toolId = childMod.toolId || `${toolsetId}/${file}`;

        const childIcon = childMod.icon ?? rootMod.icon;

        children.push({
          ...childMod,
          toolId,
          filename,
          icon: childIcon,
          parentId: toolsetId
        });
      }
    }

    // Generate version for tool set based on children
    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: parentIcon,
      filename,
      handler: () => Promise.resolve({}),
      versionList: []
    });
    tools.push(...children);
  } else {
    // is not toolset
    const icon = rootMod.icon;

    tools.push({
      ...(rootMod as ToolType),
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon,
      filename
    });
  }

  tools.forEach((tool) => devToolIds.add(tool.toolId));
  return tools;
};

// Load tool or toolset and its children
export const LoadToolsByFilename = async (filename: string): Promise<ToolType[]> => {
  const start = Date.now();

  const filePath = path.join(toolsDir, filename);

  // Calculate file content hash for cache key
  const fileSize = await stat(filePath).then((res) => res.size);
  // This ensures same content reuses the same cached module
  const modulePath = `${filePath}?v=${fileSize}`;

  const rootMod = (await import(modulePath)).default as ToolType | ToolSetType;

  if (!rootMod.toolId) {
    logger.error(`Can not parse toolId, filename: ${filename}`);
    return [];
  }

  logger.debug(`Load tool ${filename} finish, time: ${Date.now() - start}ms`);

  return parseMod({ rootMod, filename });
};

export const parseMod = async ({
  rootMod,
  filename
}: {
  rootMod: ToolSetType | ToolType;
  filename: string;
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

      tools.push({
        ...child,
        toolId: childToolId,
        parentId: toolsetId,
        tags: rootMod.tags,
        author: rootMod.author,
        icon: childIcon,
        filename
      });
    }

    // push parent
    tools.push({
      ...rootMod,
      tags: rootMod.tags || [ToolTagEnum.enum.other],
      toolId: toolsetId,
      icon: parentIcon,
      filename,
      handler: () => Promise.resolve({}),
      versionList: []
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
      filename
    });
  }
  return tools;
};

export const loadTool = async (filename: string, dev: boolean) => {
  return dev ? await LoadToolsDev(filename) : await LoadToolsByFilename(filename);
};
