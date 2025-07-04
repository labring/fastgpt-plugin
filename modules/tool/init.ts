import path from 'path';
import { isProd } from '@/constants';
import type { ToolType, ToolConfigWithCbType, ToolSetType } from './type';
import { tools } from './constants';
import fs from 'fs';
import { addLog } from '@/utils/log';
import { ToolTypeEnum } from './type/tool';

const filterToolList = ['.DS_Store', '.git', '.github', 'node_modules', 'dist', 'scripts'];

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
  const rootMod = (await import(toolRootPath)).default as ToolSetType;
  const defaultIcon = `/imgs/tools/${filename.split('.')[0]}.svg`;

  if ('children' in rootMod || fs.existsSync(path.join(toolRootPath, 'children'))) {
    const toolsetId = isProd ? rootMod.toolId! : filename;
    const icon = rootMod.icon || defaultIcon;

    // is toolSet
    tools.push({
      ...rootMod,
      type: rootMod.type || ToolTypeEnum.other,
      toolId: toolsetId,
      icon,
      toolDirName: filename,
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

    const children = isProd ? rootMod.children : await getChildren(toolRootPath);

    for (const child of children) {
      const toolId = child.toolId!;

      tools.push({
        ...child,
        toolId,
        parentId: toolsetId,
        type: rootMod.type,
        courseUrl: rootMod.courseUrl,
        author: rootMod.author,
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

  const toolDirs = fs.readdirSync(basePath).filter((file) => !filterToolList.includes(file));
  for (const tool of toolDirs) {
    const tmpTools = await LoadToolsByFilename(basePath, tool);
    tools.push(...tmpTools);
  }

  addLog.info(`Load tools in ${isProd ? 'production' : 'development'} env, total: ${tools.length}`);
}
