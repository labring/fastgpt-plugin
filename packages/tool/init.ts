import path from 'path';
import { isProd } from '@/constants';
import type { ToolType, ToolConfigWithCbType, ToolSetConfigType } from './type';
import { tools } from './constants';
import { findToolIcon } from './utils/icon';
import fs from 'fs';
import { addLog } from '@/utils/log';
import { ToolTypeEnum } from './type/tool';

const saveFile = async (url: string, path: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(path, Buffer.from(buffer));
  return buffer;
};

// Load tool or toolset and its children
export const LoadToolsByFilename = async (
  basePath: string,
  filename: string
): Promise<ToolType[]> => {
  const tools: ToolType[] = [];

  const toolRootPath = path.join(basePath, filename);
  const rootMod = (await import(toolRootPath)).default as ToolConfigWithCbType | ToolSetConfigType;
  const defaultIcon = findToolIcon(filename);

  if ('children' in rootMod) {
    const toolsetId = rootMod.toolId || filename;
    const icon = rootMod.icon || defaultIcon;

    tools.push({
      ...rootMod,
      toolId: toolsetId,
      icon,
      toolDirName: filename,
      cb: () => Promise.resolve({}),
      versionList: []
    });
    // Push children
    const children = rootMod.children;

    for (const child of children) {
      const toolId = child.toolId || `${toolsetId}/${child}`;

      tools.push({
        ...child,
        toolId,
        parentId: toolsetId,
        type: rootMod.type,
        icon,
        toolDirName: filename
      });
    }
  } else {
    const tool = (await import(toolRootPath)).default as ToolConfigWithCbType;

    tools.push({
      ...tool,
      type: tool.type || ToolTypeEnum.tools,
      icon: tool.icon || defaultIcon,
      toolId: tool.toolId || filename,
      toolDirName: filename
    });
  }

  return tools;
};

export async function initTool() {
  const basePath = isProd
    ? process.env.TOOLS_DIR || path.join(process.cwd(), 'dist', 'tools')
    : path.join(__dirname, 'packages');

  const toolDirs = fs.readdirSync(basePath);
  for (const tool of toolDirs) {
    const tmpTools = await LoadToolsByFilename(basePath, tool);
    tools.push(...tmpTools);
  }

  addLog.info(`Load tools in ${isProd ? 'production' : 'development'} env, total: ${tools.length}`);
}
