import { serve, type ServerType } from '@hono/node-server';

import { env } from '@infrastructure/env';
import { app } from '@infrastructure/hono/app';
import { configureLogger, destroyLogger, getLogger, root } from '@infrastructure/logger';
import { configureProxy } from '@infrastructure/utils/proxy';

import deps from './src/deps';
import { init } from './src/init';
import { makePluginRoute } from './src/routes/plugin.route';
import { makeToolRoute } from './src/routes/tool.route';

const pluginRoute = makePluginRoute(deps);
const toolRoute = makeToolRoute(deps);

app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer'
});

app.route('/api', pluginRoute);
app.route('/api', toolRoute);

const logger = getLogger(root);

let server: ServerType | null = null;

/**
 * NOTE:
 * Keep the infras loading order
 */
async function prepare() {
  configureProxy(); // setup global proxy
  await configureLogger(); // setup logger
  init();
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
