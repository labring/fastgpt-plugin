import path from 'path';
import { isProd } from '@/constants';
import type { ToolType, ToolSetType } from './type';
import { tools } from './constants';
import fs from 'fs';

const saveFile = async (url: string, path: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(path, Buffer.from(buffer));
  return buffer;
};

const LoadTool = (mod: ToolType | ToolSetType, filename: string) => {
  const defaultToolId = filename.split('.').shift() as string;
  const toolId = mod.toolId || defaultToolId;
  if (!mod.isToolSet) {
    tools.push({
      ...mod,
      toolId,
      toolFile: filename
    } as ToolType);
  } else {
    const children = (mod as ToolSetType).children as ToolType[];
    tools.push({
      ...mod,
      toolFile: filename,
      toolId,
      inputs: [],
      outputs: []
    } as ToolType);
    tools.push(...children.map((child) => ({ ...child, toolFile: filename })));
  }
};

const LoadToolsProd = async () => {
  const toolsDir = process.env.TOOLS_DIR || path.join(process.cwd(), 'dist', 'tools');
  // 两种方式：
  // 1. 读取 tools 目录下所有目录的 index.js 文件作为 tool
  const files = fs.readdirSync(toolsDir);
  for (const file of files) {
    const filePath = path.join(toolsDir, file);
    const mod = (await import(filePath)).default as ToolType;
    LoadTool(mod, file);
  }
  // 2. 读取 tools.json 文件中的配置（通过网络挂载）
  const toolConfigPath = path.join(process.cwd(), 'dist', 'tools.json');
  if (fs.existsSync(toolConfigPath)) {
    const toolConfig = JSON.parse(fs.readFileSync(toolConfigPath, 'utf-8')) as {
      toolId: string;
      url: string;
    }[];
    // every string is a url to get a .js file
    for (const tool of toolConfig) {
      await saveFile(tool.url, path.join(toolsDir, tool.toolId + '.js'));
      const mod = (await import(path.join(toolsDir, tool.toolId + '.js'))).default as ToolType;
      LoadTool(mod, tool.toolId);
    }
  }
  console.log(
    `\
  =================
  reading tools in prod mode
  tools:\n[ ${tools.map((tool) => tool.toolId).join(', ')} ]
  amount: ${tools.length}
  =================
      `
  );
};

async function LoadToolsDev() {
  const toolsPath = path.join(__dirname, 'packages');
  const toolDirs = fs.readdirSync(toolsPath);
  for (const tool of toolDirs) {
    const toolPath = path.join(toolsPath, tool);
    const mod = (await import(toolPath)).default as ToolType | ToolSetType;
    LoadTool(mod, tool);
  }
  console.log(
    `\
  =================
  reading tools in dev mode
  tools:\n[ ${tools.map((tool) => tool.toolId).join(', ')} ]
  amount: ${tools.length}
  =================
          `
  );
}

export async function initTool() {
  if (isProd) {
    await LoadToolsProd();
  } else {
    await LoadToolsDev();
  }
}
