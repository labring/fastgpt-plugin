import { LoadToolsByFilename } from './utils';
import { LoadToolsDev } from './loadToolDev';
import { join, parse } from 'path';
import { readdir } from 'fs/promises';
import { unpkg } from '@/utils/zip';
import type { ToolMapType } from './type';
import { isProd } from '@/constants';
import { MongoPluginModel } from '@/mongo/models/plugins';
import { downloadFile, ensureDir } from '@/utils/fs';
import { addLog } from '@/utils/log';
import { basePath, toolsDir, tempDir, tempPkgDir, tempToolsDir } from './constants';
import { catchError } from '@/utils/catch';
import { existsSync } from 'fs';

const filterToolList = ['.DS_Store', '.git', '.github', 'node_modules', 'dist', 'scripts'];

export async function initTools() {
  await Promise.all([ensureDir(toolsDir), ensureDir(tempDir), ensureDir(tempToolsDir)]);
  // 1. download pkgs into pkg dir
  // 1.1 get tools from mongo
  const toolsInMongo = await MongoPluginModel.find({
    type: 'tool'
  }).lean();
  // 1.2 download it to temp dir
  await Promise.all(
    toolsInMongo.map(async (tool) => {
      await downloadFile(tool.objectName, tempPkgDir);
    })
  );

  // 1.3 unpkg all files
  const downloadedPkgs = existsSync(tempPkgDir)
    ? (await readdir(tempPkgDir)).map((item) => join(tempPkgDir, item))
    : [];
  const sideLoadPath = join(basePath, 'dist', 'sideload', 'pkgs');
  const sideloadedPkgs = existsSync(sideLoadPath)
    ? (await readdir(sideLoadPath)).map((item) => join(sideLoadPath, item))
    : [];

  // console.log(downloadedPkgs, sideloadedPkgs);
  await Promise.all(
    [...downloadedPkgs, ...sideloadedPkgs].map(async (tool) => {
      // unpkg it
      const unpkgTarget = join(tempDir, 'tools', parse(tool).name);
      await unpkg(tool, unpkgTarget);
      // verify it
      {
        const [toolId, err] = await catchError(async () => {
          const mod = (await import(join(unpkgTarget, 'index.js'))).default;
          return mod.toolId;
        });
        if (err || !toolId) {
          addLog.error(`Tool: ${tool} is invalid`);
          return Promise.resolve();
        }
      }
    })
  );
  // 2. get all tool dirs
  const files = await readdir(tempToolsDir);
  const toolMap: ToolMapType = new Map();
  const promises = files.map(async (filename) => {
    const loadedTools = await LoadToolsByFilename(filename);
    loadedTools.forEach((tool) => toolMap.set(tool.toolId, tool));
  });
  await Promise.all(promises);

  // 3. read dev tools, if in dev mode
  if (!isProd && process.env.DISABLE_DEV_TOOLS !== 'true') {
    const dir = join(basePath, 'modules', 'tool', 'packages');
    const dirs = (await readdir(dir)).filter((filename) => !filterToolList.includes(filename));
    const devTools = (
      await Promise.all(
        dirs.map(async (filename) => {
          return LoadToolsDev(filename);
        })
      )
    ).flat();
    for (const tool of devTools) {
      toolMap.set(tool.toolId, tool);
    }
  }
  addLog.info(`Load Tools: ${toolMap.size}`);
  return toolMap;
}
