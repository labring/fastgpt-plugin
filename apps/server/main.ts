import { inspect } from 'node:util';

import { serve, type ServerType } from '@hono/node-server';

import { env } from '@infrastructure/env';
import { app } from '@infrastructure/hono/app';
import { configureLogger, destroyLogger, getLogger, mod, root } from '@infrastructure/logger';
import { configureMetrics, destroyMetrics } from '@infrastructure/metrics';
import { configureProxy } from '@infrastructure/utils/proxy';
import { getErrText } from '@shared/utils/err';

import deps from './src/deps';
import { init } from './src/init';
import { makeModelRoute } from './src/routes/model.route';
import { makePluginRoute } from './src/routes/plugin.route';
import { makeRuntimeRoute } from './src/routes/runtime.route';
import { makeToolRoute } from './src/routes/tool.route';
import { makeWorkflowRoute } from './src/routes/workflow.route';

await configureLogger(); // setup logger
await configureMetrics(); // setup metrics
const logger = getLogger(root);
logger.debug(env);

const modelRoute = makeModelRoute(deps);
const pluginRoute = makePluginRoute(deps);
const runtimeRoute = makeRuntimeRoute(deps);
const toolRoute = makeToolRoute({ toolManager: deps.toolManager, logger: getLogger(mod.tool) });
const workflowRoute = makeWorkflowRoute();

app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer'
});

app.route('/api', modelRoute);
app.route('/api', pluginRoute);
app.route('/api', runtimeRoute);
app.route('/api', toolRoute);
app.route('/api', workflowRoute);

let server: ServerType | null = null;

/**
 * NOTE:
 * Keep the infras loading order
 */
async function prepare() {
  configureProxy(); // setup global proxy
  await init();
}

let shuttingDown = false;

async function closeServer(): Promise<void> {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      logger.info('HTTP server closed');
      resolve();
    });
  });
}

function shutdown() {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  void (async () => {
    let exitCode = 0;

    try {
      await closeServer();
      await destroyMetrics();
    } catch (error) {
      exitCode = 1;
      logger.error('Failed to shutdown server cleanly', { error });
    } finally {
      await destroyLogger();
      process.exit(exitCode);
    }
  })();
}

async function main() {
  try {
    await prepare();
  } catch (error) {
    const errorMessage = getErrText(error, 'Unknown server internal error while preparing');

    console.error(inspect(error, { depth: null }));
    console.info(`Failed startup server: ${errorMessage}`);
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
