import { getLogger, mod } from '@/lib/logger';
import { batch, refreshDir } from '@fastgpt-plugin/helpers/index';
import { toolsDir, UploadToolsS3Path } from './constants';
import { getCachedData } from '@/lib/cache';
import { SystemCacheKeyEnum } from '@/lib/cache/type';
import { MongoSystemPlugin } from '@/lib/mongo/models/plugins';
import type { CacheToolMapType } from './types/tool';
import { LoadToolsByFilename } from './utils/tool';
import { getPrivateS3Server } from '@/lib/s3';

declare global {
  var isIniting: boolean;
}

/**
 * Init tools when system starting.
 * Download all pkgs from minio, load sideloaded pkgs
 */
export async function initTools() {
  const logger = getLogger(mod.tool);
  if (global.isIniting) {
    return systemCache.systemTool.data;
  }
  global.isIniting = true;
  try {
    const start = Date.now();
    logger.info('Load tools start');
    await refreshDir(toolsDir);
    // 1. download pkgs into pkg dir
    // 1.1 get tools from mongo
    const toolsInMongo = await MongoSystemPlugin.find({
      type: 'tool'
    }).lean();
    logger.debug(`Tools in mongo: ${toolsInMongo.length}`);
    const toolMap: CacheToolMapType = new Map();
    // 2 download it to temp dir, and parse it
    const privateS3Server = getPrivateS3Server();
    await batch(
      50,
      toolsInMongo.map((tool) => async () => {
        const filepath = await privateS3Server.downloadFile({
          downloadPath: toolsDir,
          objectName: `${UploadToolsS3Path}/${tool.toolId}.js`
        });
        if (!filepath) return;
        const filename = filepath.replace(`${toolsDir}/`, '');
        const loadedTool = await LoadToolsByFilename(filename);
        if (loadedTool) {
          toolMap.set(loadedTool.toolId, loadedTool);
        }
      })
    );
    logger.info(`Load tools finish: ${toolMap.size}, time: ${Date.now() - start}ms`);
    global.isIniting = false;
    return toolMap;
  } catch (e) {
    logger.error(`Load tools Error: ${e}`);
    global.isIniting = false;
    return getCachedData(SystemCacheKeyEnum.systemTool);
  }
}
