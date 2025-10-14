import { isProd } from '@/constants';
import { builtinTools, uploadedTools } from './constants';
import fs from 'fs';
import { addLog } from '@/utils/log';
import { BuiltInToolBaseURL, LoadToolsByFilename, UploadedToolBaseURL } from './utils';
import { refreshUploadedTools } from './controller';
import { basePath } from 'runtime/utils/const';
import { join } from 'path';
import { readdir } from 'fs/promises';
import { unpkg } from '@/utils/zip';

const filterToolList = ['.DS_Store', '.git', '.github', 'node_modules', 'dist', 'scripts'];

const toolPkgsDir = join(basePath, 'dist', 'pkgs', 'tool');
const toolDir = join(basePath, 'dist', 'tools');

export async function initTools() {
  // 1. get all tool pkgs
  const pkgs = await readdir(toolPkgsDir);
  const promises = pkgs.map((pkg) =>
    unpkg(join(toolPkgsDir, pkg), join(toolDir, pkg.replace('.pkg', '')))
  );
  await Promise.all(promises);
  // 2. read the tools
}
