import { app } from '@/app';
import { tempDir, tempToolsDir } from '@/modules/tool/constants';
import { initWorkflowTemplates } from '@/modules/workflow/init';
import { configureProxy } from '@/utils/setup-proxy';
import { serve, type ServerType } from '@hono/node-server';
import { env } from '@/env';
import { initModels } from '@/modules/model/model.init';
import { initDatasets } from '@/modules/dataset/dataset.init';
import { configureLogger, getLogger, root } from '@/infra/logger';
import { initS3Service } from '@/infra/s3';
import { connectionMongo, connectMongo, MONGO_URL } from '@/infra/mongo';
import { getCachedData, refreshVersionKey } from '@/infra/redis/cache';
import { SystemCacheKeyEnum } from '@/infra/redis/cache/type';

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
    initModels(), // initialize model list
    initWorkflowTemplates(), // initialize workflow templates
    initDatasets()
  ]);
}

function shutdown() {
  server?.close(async () => {
    logger.info('HTTP server closed');
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
      logger.info(`Server is listening at http://0.0.0.0:${info.port}`);
    }
  );
}

if (import.meta.main) {
  await main();
}
