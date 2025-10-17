import { LoadToolsByFilename, LoadToolsDev } from './utils';
import { join } from 'path';
import { readdir, rename } from 'fs/promises';
import { unpkg } from '@/utils/zip';
import type { ToolMapType, ToolType } from './type';
import { isProd } from '@/constants';
import { MongoPluginModel } from '@/mongo/models/plugins';
import { downloadFile, ensureDir } from '@/utils/fs';
import { addLog } from '@/utils/log';
import { basePath, toolDir, toolPkgsDir, toolTempDir, toolTempPkgDir } from './constants';
import { catchError } from '@/utils/catch';
import { rm } from 'fs/promises';

const filterToolList = ['.DS_Store', '.git', '.github', 'node_modules', 'dist', 'scripts'];

export async function initTools() {
  await Promise.all([ensureDir(toolPkgsDir), ensureDir(toolDir), ensureDir(toolTempDir)]);
  // 1. download pkgs into pkg dir
  // 1.1 get tools from mongo
  const toolsInMongo = await MongoPluginModel.find({
    type: 'tool'
  }).lean();
  // 1.2 download it to temp dir
  for (const tool of toolsInMongo) {
    // download
    const filepath = await downloadFile(tool.objectName, toolTempPkgDir);
    const filename = tool.objectName.split('/').pop()!;
    if (!filepath) {
      addLog.warn(`Tool: ${tool.toolId} is invalid`);
      continue;
    }
    // unpkg it
    const unpkgTarget = join(toolTempDir, filename);
    await unpkg(filepath, unpkgTarget);
    // verify it
    {
      const [toolId, err] = await catchError(async () => {
        const mod = (await import(join(unpkgTarget, 'index.js'))).default;
        return !!mod.toolId;
      });
      if (err || !toolId) {
        addLog.error(`Tool: ${tool.toolId} is invalid`);
        continue;
      }
    }

    // verified, mv the dir
    const mvTarget = join(toolDir, filename);
    // Check if target exists and remove it first
    await catchError(() => rm(mvTarget, { recursive: true, force: true }));
    await rename(unpkgTarget, mvTarget);
  }

  // 2. get all tool dirs
  const files = await readdir(toolDir);
  const toolMap: ToolMapType = new Map();
  const promises = files.map(async (filename) => {
    const loadedTools = await LoadToolsByFilename(filename);
    loadedTools.forEach((tool) => toolMap.set(tool.toolId, tool));
  });

  // 3. read dev tools, if in dev mode
  await Promise.all(promises);
  if (!isProd) {
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
