import path from 'path';
import { isProd } from '@/constants';
import type { ToolType, ToolConfigWithCbType, ToolSetType } from './type';
import { tools } from './constants';
import fs from 'fs';
import { addLog } from '@/utils/log';
import { ToolTypeEnum } from './type/tool';

const filterToolList = ['.DS_Store', '.git', '.github', 'node_modules', 'dist', 'scripts'];

// Load tool or toolset and its children
export const LoadToolsByFilename = async (
  basePath: string,
  filename: string,
  toolSource: 'built-in' | 'uploaded' = 'built-in'
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

export async function initTool() {
  const basePath = isProd
    ? process.env.TOOLS_DIR || path.join(process.cwd(), 'dist', 'tools', 'built-in')
    : path.join(__dirname, 'packages');

  // Create directory if it doesn't exist
  if (!fs.existsSync(basePath)) {
    addLog.info(`Creating built-in tools directory: ${basePath}`);
    fs.mkdirSync(basePath, { recursive: true });
  }

  const toolDirs = fs.readdirSync(basePath).filter((file) => !filterToolList.includes(file));
  for (const tool of toolDirs) {
    const tmpTools = await LoadToolsByFilename(basePath, tool, 'built-in');
    tools.push(...tmpTools);
  }

  addLog.info(`Load tools in ${isProd ? 'production' : 'development'} env, total: ${tools.length}`);
}

export async function initUploadedTool() {
  const basePath = isProd
    ? process.env.TOOLS_DIR || path.join(process.cwd(), 'dist', 'tools', 'uploaded')
    : path.join(__dirname, 'packages');

  // Create directory if it doesn't exist
  if (!fs.existsSync(basePath)) {
    addLog.info(`Creating uploaded tools directory: ${basePath}`);
    fs.mkdirSync(basePath, { recursive: true });
  }

  const toolDirs = fs.readdirSync(basePath).filter((file) => !filterToolList.includes(file));
  for (const tool of toolDirs) {
    const tmpTools = await LoadToolsByFilename(basePath, tool, 'uploaded');
    tools.push(...tmpTools);
  }

  addLog.info(`Load tools in ${isProd ? 'production' : 'development'} env, total: ${tools.length}`);
}
