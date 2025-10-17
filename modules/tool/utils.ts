import { isProd } from '@/constants';
import { join } from 'path';
import type { ToolConfigWithCbType, ToolSetType, ToolType } from './type';
import { ToolTypeEnum } from 'sdk/client';
import { iconFormats } from './utils/icon';
import { addLog } from '@/utils/log';
import { basePath, devToolIds } from './constants';
import { exists } from 'fs/promises';
import { readdir } from 'fs/promises';

export const UploadedToolBaseURL = join(process.cwd(), 'dist', 'tools', 'uploaded');
export const BuiltInToolBaseURL = isProd
  ? join(process.cwd(), 'dist', 'tools', 'built-in')
  : join(process.cwd(), '..', '..', 'modules', 'tool', 'packages');

// Supported image formats for tool icons

/**
 * Find tool icon with supported formats in the public directory
 * @param toolId Tool name (without extension)
 * @returns Icon path if found, default svg path otherwise
 */
async function findToolIcon(toolId: string) {
  const iconBasePath = isProd
    ? join(process.cwd(), 'dist', 'public', 'imgs', 'tools')
    : join(process.cwd(), 'public', 'imgs', 'tools');

  // Check for existing icon files with different formats
  for (const format of iconFormats) {
    const iconPath = join(iconBasePath, `${toolId}.${format}`);
    if (await exists(iconPath)) {
      return `/imgs/tools/${toolId}.${format}`;
    }
  }
}

// Load tool or toolset and its children
export const LoadToolsByFilename = async (filename: string): Promise<ToolType[]> => {
  const tools: ToolType[] = [];
  const toolRootPath = join(basePath, 'dist', 'tools', filename);
  const rootMod = (await import(toolRootPath)).default as ToolType | ToolSetType;

  const checkRootModToolSet = (rootMod: ToolType | ToolSetType): rootMod is ToolSetType => {
    return 'children' in rootMod;
  };

  if (checkRootModToolSet(rootMod)) {
    const toolsetId = rootMod.toolId;
    if (!toolsetId) {
      addLog.error(`Can not parse toolId, filename: ${filename}`);
      return [];
    }

    const parentIcon = rootMod.icon || (await findToolIcon(toolsetId)) || '';

    // push parent
    tools.push({
      ...rootMod,
      type: rootMod.type || ToolTypeEnum.other,
      toolId: toolsetId,
      icon: parentIcon,
      toolFilename: `${filename}`,
      cb: () => Promise.resolve({}),
      versionList: []
    });

    const children = rootMod.children;

    for (const child of children) {
      const toolId = child.toolId;
      if (!toolId) {
        addLog.error(`Can not parse toolId, filename: ${filename}`);
        continue;
      }
      const childIcon = (await findToolIcon(toolId)) || parentIcon;

      tools.push({
        ...child,
        toolId,
        parentId: toolsetId,
        type: rootMod.type,
        courseUrl: rootMod.courseUrl,
        author: rootMod.author,
        icon: childIcon,
        toolFilename: filename
      });
    }
  } else {
    // NOTE: fallback to filename only when the plugin service running in dev mode.
    const toolId = rootMod.toolId;
    if (!toolId) {
      addLog.error(`Can not parse toolId, filename: ${filename}`);
      return [];
    }

    const icon = rootMod.icon || (await findToolIcon(toolId)) || '';

    tools.push({
      ...rootMod,
      type: rootMod.type || ToolTypeEnum.tools,
      icon,
      toolId,
      toolFilename: filename
    });
  }

  return tools;
};

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
  const isToolSet = await exists(childrenPath);

  const toolsetId = rootMod.toolId || filename;

  if (isToolSet) {
    tools.push({
      ...rootMod,
      type: rootMod.type || ToolTypeEnum.other,
      toolId: toolsetId,
      icon: rootMod.icon,
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
          toolFilename: filename
        });
      }
    }

    tools.push(...children);
  } else {
    // is not toolset
    tools.push({
      ...(rootMod as ToolType),
      type: rootMod.type || ToolTypeEnum.other,
      toolId: toolsetId,
      icon: rootMod.icon,
      toolFilename: filename,
      versionList: []
    });
  }

  tools.forEach((tool) => devToolIds.add(tool.toolId));

  return tools;
};
