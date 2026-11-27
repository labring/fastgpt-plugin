import { inspect } from 'node:util';

import { serve, type ServerType } from '@hono/node-server';

import { serverEnv } from '@infrastructure/env';
import { app } from '@infrastructure/hono/app';
import { configureLogger, destroyLogger, getLogger, mod, root } from '@infrastructure/logger';
import { configureMetrics, destroyMetrics } from '@infrastructure/metrics';
import { configureProxy } from '@infrastructure/utils/proxy';
import { getErrText } from '@shared/utils/err';

import deps, { internalPluginInvokeTokenService, pruneExpiredPluginUploads } from './src/deps';
import { init } from './src/init';
import { makeDebugSessionRoute } from './src/routes/debug-session.route';
import { makeInternalInvokeRoute } from './src/routes/internal-invoke.route';
import { makeModelRoute } from './src/routes/model.route';
import { makeModerationRoute } from './src/routes/moderation.route';
import { makePluginRoute } from './src/routes/plugin.route';
import { makePluginServiceFeatureRoute } from './src/routes/plugin-service-feature.route';
import { makeRuntimeRoute } from './src/routes/runtime.route';
import { makeToolRoute } from './src/routes/tool.route';
import { makeWorkflowRoute } from './src/routes/workflow.route';

await configureLogger(); // setup logger
await configureMetrics(); // setup metrics
const logger = getLogger(root);
logger.debug({
  ...serverEnv,
  COWORKERD_MANAGEMENT_TOKEN: serverEnv.COWORKERD_MANAGEMENT_TOKEN ? '[redacted]' : undefined,
  INTERNAL_PLUGIN_INVOKE_SECRET: serverEnv.INTERNAL_PLUGIN_INVOKE_SECRET ? '[redacted]' : undefined
});

const modelRoute = makeModelRoute(deps);
const debugSessionRoute = makeDebugSessionRoute(deps);
const pluginRoute = makePluginRoute(deps);
const pluginServiceFeatureRoute = makePluginServiceFeatureRoute();
const runtimeRoute = makeRuntimeRoute(deps);
const toolRoute = makeToolRoute({ toolManager: deps.toolManager, logger: getLogger(mod.tool) });
const moderationRoute = makeModerationRoute({
  moderationManager: deps.moderationManager,
  logger: getLogger(mod.moderation)
});
const workflowRoute = makeWorkflowRoute(deps);

app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer'
});

// Scoped invocation credentials are intentionally separate from /api/* management authentication.
if (internalPluginInvokeTokenService) {
  app.route('/internal/plugin-invoke', makeInternalInvokeRoute({
    tokenService: internalPluginInvokeTokenService,
    fastgptBaseUrl: serverEnv.FASTGPT_BASE_URL,
    maxUploadBytes: serverEnv.MAX_FILE_SIZE
  }));
}

app.route('/api', modelRoute);
app.route('/api', debugSessionRoute);
app.route('/api', pluginRoute);
app.route('/api', pluginServiceFeatureRoute);
app.route('/api', runtimeRoute);
app.route('/api', toolRoute);
app.route('/api', moderationRoute);
app.route('/api', workflowRoute);

let server: ServerType | null = null;
let uploadCleanupTimer: ReturnType<typeof setInterval> | undefined;
let uploadCleanupRunning = false;
async function cleanExpiredUploads() {
  if (uploadCleanupRunning) return;
  uploadCleanupRunning = true;
  try {
    const [, error] = await pruneExpiredPluginUploads();
    if (error) logger.error('Failed to clean expired plugin uploads', { error });
  } catch (error) {
    logger.error('Failed to clean expired plugin uploads', { error });
  } finally {
    uploadCleanupRunning = false;
  }
}

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
  if (uploadCleanupTimer) clearInterval(uploadCleanupTimer);

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

  if (serverEnv.PLUGIN_RUNTIME_MODE === 'coworkerd') {
    void cleanExpiredUploads();
    uploadCleanupTimer = setInterval(() => { void cleanExpiredUploads(); }, 60_000);
    uploadCleanupTimer.unref();
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  server = serve(
    {
      fetch: app.fetch,
      port: serverEnv.PORT
    },
    (info) => {
      logger.info(`Server is listening at http://0.0.0.0:${info.port}`);
    }
  );
}

if (import.meta.main) {
  await main();
}
