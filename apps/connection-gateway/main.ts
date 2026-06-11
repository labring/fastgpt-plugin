import { inspect } from 'node:util';

import { serve, type ServerType } from '@hono/node-server';

import { env } from '@infrastructure/env';
import { configureLogger, destroyLogger, getLogger, root } from '@infrastructure/logger';
import { configureMetrics, destroyMetrics } from '@infrastructure/metrics';
import { configureProxy } from '@infrastructure/utils/proxy';
import { getErrText } from '@shared/utils/err';

import { makeConnectionGatewayDeps } from './src/deps';
import { createConnectionGatewayApp } from './src/routes';

await configureLogger();
await configureMetrics();

const logger = getLogger(root);
const deps = makeConnectionGatewayDeps();
const app = createConnectionGatewayApp(deps);

let server: ServerType | null = null;
let shuttingDown = false;

async function prepare() {
  configureProxy();
  await deps.tcpTransport.start();
}

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
      await deps.tcpTransport.stop();
      await closeServer();
      await deps.redisClient.disconnect();
      await destroyMetrics();
    } catch (error) {
      exitCode = 1;
      logger.error('Failed to shutdown connection gateway cleanly', { error });
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
    const errorMessage = getErrText(error, 'Unknown connection gateway startup error');

    console.error(inspect(error, { depth: null }));
    console.info(`Failed startup connection gateway: ${errorMessage}`);
    shutdown();
    return;
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  server = serve(
    {
      fetch: app.fetch,
      port: env.CONNECTION_GATEWAY_PORT
    },
    (info) => {
      logger.info(`Connection Gateway HTTP server is listening at http://0.0.0.0:${info.port}`);
      logger.info(`Connection Gateway TCP server is listening at tcp://0.0.0.0:${env.CONNECTION_GATEWAY_TCP_PORT}`);
    }
  );
}

if (import.meta.main) {
  await main();
}
