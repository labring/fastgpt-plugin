import { isProd } from '@/constants';
import path from 'path';
import type { ToolConfigWithCbType, ToolSetType, ToolType } from './type';
import { ToolTypeEnum } from 'sdk/client';
import fs from 'fs';
import { iconFormats } from './utils/icon';

export const UploadedToolBaseURL = path.join(process.cwd(), 'dist', 'tools', 'uploaded');
export const BuiltInToolBaseURL = isProd
  ? path.join(process.cwd(), 'dist', 'tools', 'built-in')
  : path.join(process.cwd(), 'modules', 'tool', 'packages');

// Supported image formats for tool icons

/**
 * Find tool icon with supported formats in the public directory
 * @param toolName Tool name (without extension)
 * @returns Icon path if found, default svg path otherwise
 */
function findToolIcon(toolName: string): string {
  const iconBasePath = path.join(process.cwd(), 'dist', 'public', 'imgs', 'tools');

  // Check for existing icon files with different formats
  for (const format of iconFormats) {
    const iconPath = path.join(iconBasePath, `${toolName}.${format}`);
    if (fs.existsSync(iconPath)) {
      return `/imgs/tools/${toolName}.${format}`;
    }
  }

  // Return default svg path if no icon found
  return `/imgs/tools/${toolName}.svg`;
}

// Load tool or toolset and its children
export const LoadToolsByFilename = async (
  filename: string,
  toolSource: 'built-in' | 'uploaded' = 'built-in'
): Promise<ToolType[]> => {
  const tools: ToolType[] = [];

  const basepath = toolSource === 'uploaded' ? UploadedToolBaseURL : BuiltInToolBaseURL;
  const toolRootPath = path.join(basepath, filename);
  const rootMod = (await import(toolRootPath)).default as ToolSetType;
  const toolName = filename.split('.')[0];
  const defaultIcon = findToolIcon(toolName);

  // Tool set
  if ('children' in rootMod || fs.existsSync(path.join(toolRootPath, 'children'))) {
    const toolsetId = isProd || toolSource === 'uploaded' ? rootMod.toolId! : filename;
    const icon = rootMod.icon || defaultIcon;

    // is toolSet
    tools.push({
      ...rootMod,
      type: rootMod.type || ToolTypeEnum.other,
      toolId: toolsetId,
      icon,
      toolDirName: `${toolSource}/${filename}`,
      toolSource,
      cb: () => Promise.resolve({}),
      versionList: []
    });
    // Push children
    const getChildren = async (toolRootPath: string) => {
      const childrenPath = path.join(toolRootPath, 'children');
      const files = fs.readdirSync(childrenPath);
      const children: ToolConfigWithCbType[] = [];
      for (const file of files) {
        const childPath = path.join(childrenPath, file);
        const childMod = (await import(childPath)).default as ToolConfigWithCbType;
        const toolId = childMod.toolId || `${toolsetId}/${file}`;
        children.push({
          ...childMod,
          toolId
        });
      }
      return children;
    };

    const children =
      isProd || toolSource === 'uploaded' ? rootMod.children : await getChildren(toolRootPath);

    for (const child of children) {
      const toolId = child.toolId!;

      tools.push({
        ...child,
        toolId,
        parentId: toolsetId,
        type: rootMod.type,
        courseUrl: rootMod.courseUrl,
        author: rootMod.author,
        icon: findToolIcon(toolId),
        toolDirName: `${toolSource}/${filename}`,
        toolSource
      });
    }
  } else {
    const tool = (await import(toolRootPath)).default as ToolConfigWithCbType;

    tools.push({
      ...tool,
      type: tool.type || ToolTypeEnum.tools,
      icon: tool.icon || defaultIcon,
      toolId: tool.toolId || filename,
      toolDirName: `${toolSource}/${filename}`,
      toolSource
    });
  }

  return tools;
};
