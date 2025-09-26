import { isProd } from '@/constants';
import { builtinTools, uploadedTools } from './constants';
import fs from 'fs';
import { addLog } from '@/utils/log';
import { BuiltInToolBaseURL, LoadToolsByFilename, UploadedToolBaseURL } from './utils';
import { refreshUploadedTools } from './controller';

const filterToolList = ['.DS_Store', '.git', '.github', 'node_modules', 'dist', 'scripts'];

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
