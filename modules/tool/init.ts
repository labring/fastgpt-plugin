import { LoadToolsDev } from './loadToolDev';
import { join } from 'path';
import { readdir } from 'fs/promises';
import type { ToolMapType } from './type';
import { isProd } from '@/constants';
import { MongoPlugin } from '@/mongo/models/plugins';
import { refreshDir } from '@/utils/fs';
import { addLog } from '@/utils/log';
import { basePath, toolsDir, UploadToolsS3Path } from './constants';
import { privateS3Server } from '@/s3';
import { LoadToolsByFilename } from './utils';
import { stat } from 'fs/promises';
import { getCachedData } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';
import { batch } from '@/utils/parallel';

const filterToolList = ['.DS_Store', '.git', '.github', 'node_modules', 'dist', 'scripts'];

declare global {
  var isIniting: boolean;
}

/**
 * Init tools when system starting.
 * Download all pkgs from minio, load sideloaded pkgs
 */
export async function initTools() {
  if (global.isIniting) {
    return systemCache.systemTool.data;
  }
  global.isIniting = true;
  try {
    await refreshDir(toolsDir);
    // 1. download pkgs into pkg dir
    // 1.1 get tools from mongo
    const toolsInMongo = await MongoPlugin.find({
      type: 'tool'
    }).lean();
    // 1.2 download it to temp dir
    await batch(
      10,
      toolsInMongo.map(
        (tool) => () =>
          privateS3Server.downloadFile({
            downloadPath: toolsDir,
            objectName: `${UploadToolsS3Path}/${tool.toolId}.js`
          })
      )
    );

    // 2. get all tool dirs
    const toolFiles = await readdir(toolsDir);
    const toolMap: ToolMapType = new Map();

    const promises = toolFiles.map(async (filename) => {
      const loadedTools = await LoadToolsByFilename(filename);
      loadedTools.forEach((tool) => toolMap.set(tool.toolId, tool));
    });
    await Promise.all(promises);

    // 3. read dev tools, if in dev mode
    if (!isProd && process.env.DISABLE_DEV_TOOLS !== 'true') {
      const dir = join(basePath, 'modules', 'tool', 'packages');
      // skip if dir not exist
      try {
        await stat(dir);
      } catch (e) {
        return toolMap;
      }
      const dirs = (await readdir(dir)).filter((filename) => !filterToolList.includes(filename));
      const devTools = (
        await Promise.all(dirs.map(async (filename) => LoadToolsDev(filename)))
      ).flat();

      // overwrite installed tools
      for (const tool of devTools) {
        toolMap.set(tool.toolId, tool);
      }
    }

    addLog.info(`Load Tools: ${toolMap.size}`);
    isIniting = false;
    return toolMap;
  } catch (e) {
    addLog.error(`Init Tools Error:`, e);
    isIniting = false;
    return getCachedData(SystemCacheKeyEnum.systemTool);
  }
}
