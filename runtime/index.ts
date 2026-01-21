import { getCachedData, refreshVersionKey } from '@/cache';
import { SystemCacheKeyEnum } from '@/cache/type';
import { connectionMongo, connectMongo, MONGO_URL } from '@/mongo';
import { ensureDir, refreshDir } from '@/utils/fs';
import { configureLogger, getLogger, root, destroyLogger } from '@/logger';
import { env } from '@/env';
import { configureProxy } from '@/utils/setup-proxy';
import { initModels } from '@model/init';
import { initDatasetSourceAvatars } from '@dataset/avatars';
import { basePath, tempDir, tempToolsDir } from '@tool/constants';
import { initWorkflowTemplates } from '@workflow/init';
import { serve, type ServerType } from '@hono/node-server';
import { app } from './app';

const logger = getLogger(root);

let server: ServerType | null = null;

/**
 * NOTE:
 * Keep the infras loading order
 */
async function prepare() {
  configureProxy(); // setup global proxy
  await configureLogger(); // setup logger

  await connectMongo(connectionMongo, MONGO_URL); // connect to MongoDB

  await refreshDir(tempDir); // cleanup 'tmp' directory
  await ensureDir(tempToolsDir); // ensure temp tools directory

  await refreshVersionKey(SystemCacheKeyEnum.systemTool); // check server version

  await Promise.all([
    getCachedData(SystemCacheKeyEnum.systemTool), // prepare cache
    initModels(globalThis.isReboot), // initialize model list
    initWorkflowTemplates(), // initialize workflow templates
    !globalThis.isReboot && initDatasetSourceAvatars()
  ]);
}

function shutdown() {
  server?.close(async () => {
    logger.info('HTTP server closed');

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
      logger.info(`Server is listening at http://localhost:${info.port}`);
    }
  );
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const reboot = args.includes('--reboot');

  globalThis.isReboot = reboot;

  await main();
}

declare global {
  var isReboot: boolean;
}
