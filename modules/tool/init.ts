import path from 'path';
import { isProd } from '@/constants';
import type { ToolType, ToolConfigWithCbType, ToolSetType } from './type';
import { builtinTools, uploadedTools } from './constants';
import fs from 'fs';
import { addLog } from '@/utils/log';
import { ToolTypeEnum } from './type/tool';
import { BuiltInToolBaseURL, UploadedToolBaseURL } from './utils';
import { refreshUploadedTools } from './controller';

const filterToolList = ['.DS_Store', '.git', '.github', 'node_modules', 'dist', 'scripts'];

// Load tool or toolset and its children
export const LoadToolsByFilename = async (
  filename: string,
  toolSource: 'built-in' | 'uploaded' = 'built-in'
): Promise<ToolType[]> => {
  const tools: ToolType[] = [];

  const basepath = toolSource === 'uploaded' ? UploadedToolBaseURL : BuiltInToolBaseURL;
  const toolRootPath = path.join(basepath, filename);
  const rootMod = (await import(toolRootPath)).default as ToolSetType;
  const defaultIcon = `/imgs/tools/${filename.split('.')[0]}.svg`;

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

async function initBuiltInTools() {
  // Create directory if it doesn't exist
  if (!fs.existsSync(BuiltInToolBaseURL)) {
    addLog.info(`Creating built-in tools directory: ${BuiltInToolBaseURL}`);
    fs.mkdirSync(BuiltInToolBaseURL, { recursive: true });
  }

  builtinTools.length = 0;
  const toolDirs = fs
    .readdirSync(BuiltInToolBaseURL)
    .filter((file) => !filterToolList.includes(file));
  for (const tool of toolDirs) {
    const tmpTools = await LoadToolsByFilename(tool, 'built-in');
    builtinTools.push(...tmpTools);
  }

  addLog.info(
    `Load builtin tools in ${isProd ? 'production' : 'development'} env, total: ${toolDirs.length}`
  );
}

export async function initUploadedTool() {
  // Create directory if it doesn't exist
  if (!fs.existsSync(UploadedToolBaseURL)) {
    addLog.info(`Creating uploaded tools directory: ${UploadedToolBaseURL}`);
    fs.mkdirSync(UploadedToolBaseURL, { recursive: true });
  }

  uploadedTools.length = 0;

  const toolDirs = fs
    .readdirSync(UploadedToolBaseURL)
    .filter((file) => !filterToolList.includes(file));
  for (const tool of toolDirs) {
    const tmpTools = await LoadToolsByFilename(tool, 'uploaded');
    uploadedTools.push(...tmpTools);
  }

  addLog.info(
    `Load uploaded tools in ${isProd ? 'production' : 'development'} env, total: ${toolDirs.length}`
  );
}

export const initTools = async () => Promise.all([initBuiltInTools(), refreshUploadedTools()]);
