import { app } from '@/app';
import { refreshVersionKey, getCachedData } from '@/lib/cache';
import { SystemCacheKeyEnum } from '@/lib/cache/type';
import { getLogger, root, configureLogger, destroyLogger } from '@/lib/logger';
import { connectMongo, connectionMongo, MONGO_URL } from '@/lib/mongo';
import { initS3Service } from '@/lib/s3';
import { initDatasetSourceAvatars } from '@/modules/dataset/avatars';
import { tempDir, tempToolsDir } from '@/modules/tool/constants';
import { initWorkflowTemplates } from '@/modules/workflow/init';
import { configureProxy } from '@/utils/setup-proxy';
import { refreshDir, ensureDir, SubPub } from '@fastgpt-plugin/helpers/index';
import { serve, type ServerType } from '@hono/node-server';
import { env } from '@/env';
import { initModels } from '@/modules/model/model.init';

const logger = getLogger(root);

let server: ServerType | null = null;

/**
 * NOTE:
 * Keep the infras loading order
 */
async function prepare() {
  configureProxy(); // setup global proxy
  await configureLogger(); // setup logger

  await initS3Service();
  await connectMongo(connectionMongo, MONGO_URL); // connect to MongoDB

  await refreshDir(tempDir); // cleanup 'tmp' directory
  await ensureDir(tempToolsDir); // ensure temp tools directory

  await refreshVersionKey(SystemCacheKeyEnum.systemTool); // check server version

  await Promise.all([
    getCachedData(SystemCacheKeyEnum.systemTool), // prepare tool cache
    initModels(globalThis.HMR), // initialize model list
    initWorkflowTemplates(), // initialize workflow templates
    !globalThis.HMR && initDatasetSourceAvatars()
  ]);
}

function shutdown() {
  server?.close(async () => {
    logger.info('HTTP server closed');

    SubPub.removeAllListeners();

    // TODO:
    // All resources should be cleanup
    await destroyLogger();
  });

  process.exit(0);
}

async function main() {
  try {
    await prepare();
  } catch (error) {
    console.error(error);
    console.info(
      `Failed startup server: ${error instanceof Error ? error.message : 'Unknown server internal error while preparing'}`
    );
    shutdown();
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  server = serve(
    {
      fetch: app.fetch,
      port: env.PORT
    },
    (info) => {
      logger.info(`Server is listening at 0.0.0.0:${info.port}`);
    }
  );
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const HMR = args.includes('--reboot');

  globalThis.HMR = HMR;

  await main();
}

declare global {
  var HMR: boolean;
}
