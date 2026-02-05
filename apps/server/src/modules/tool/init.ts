import { getLogger, mod } from '@/lib/logger';
import { batch, refreshDir } from '@fastgpt-plugin/helpers/index';
import { toolsDir, UploadToolsS3Path } from './constants';
import { getCachedData } from '@/lib/cache';
import { SystemCacheKeyEnum } from '@/lib/cache/type';
import { MongoSystemPlugin } from '@/lib/mongo/models/plugins';
import { privateS3Server } from '@/lib/s3';
import { LoadToolsByFilename } from './loadToolProd';
import type { CacheToolMapType } from './types/tool';

const logger = getLogger(mod.tool);

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

    // 3. read dev tools, if in dev mode
    // if (!isProd && !env.DISABLE_DEV_TOOLS) {
    //   const dir = join(basePath, 'modules', 'tool', 'packages');
    //   // skip if dir not exist
    //   try {
    //     await stat(dir);
    //   } catch (e) {
    //     return toolMap;
    //   }
    //   const dirs = (await readdir(dir)).filter((filename) => !filterToolList.includes(filename));
    //   const devTools = (
    //     await Promise.all(dirs.map(async (filename) => LoadToolsDev(filename)))
    //   ).flat();

    //   // overwrite installed tools
    //   for (const tool of devTools) {
    //     toolMap.set(tool.toolId, tool);
    //   }
    // }

    logger.info(`Load tools finish: ${toolMap.size}, time: ${Date.now() - start}ms`);
    global.isIniting = false;
    return toolMap;
  } catch (e) {
    logger.error(`Load tools Error: ${e}`);
    global.isIniting = false;
    return getCachedData(SystemCacheKeyEnum.systemTool);
  }
}
