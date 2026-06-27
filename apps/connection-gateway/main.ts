import { inspect } from 'node:util';

import { serve, type ServerType } from '@hono/node-server';

import { gatewayEnv } from '@infrastructure/env';
import { configureLogger, destroyLogger, getLogger, root } from '@infrastructure/logger';
import { configureMetrics, destroyMetrics } from '@infrastructure/metrics';
import { configureProxy } from '@infrastructure/utils/proxy';
import { getErrText } from '@shared/utils/err';

import { makeConnectionGatewayDeps } from './src/deps';
import { createConnectionGatewayApp } from './src/routes';

const logger = getLogger(root);

let httpServer: ServerType | null = null;
let wsServer: ServerType | null = null;
let shuttingDown = false;
let deps: ReturnType<typeof makeConnectionGatewayDeps> | null = null;

async function prepare(activeDeps: ReturnType<typeof makeConnectionGatewayDeps>) {
  configureProxy(gatewayEnv);
}

async function closeServer(server: ServerType | null): Promise<void> {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
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
      await deps?.websocketTransport.stop();
      deps?.unregisterMetrics();
      await deps?.mailbox.disconnect?.();
      await closeServer(wsServer);
      await closeServer(httpServer);
      await deps?.redisClient.disconnect();
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
  await configureLogger(gatewayEnv);
  await configureMetrics(gatewayEnv);
  deps = makeConnectionGatewayDeps();
  const app = createConnectionGatewayApp(deps);

  try {
    await prepare(deps);
  } catch (error) {
    const errorMessage = getErrText(error, 'Unknown connection gateway startup error');

    console.error(inspect(error, { depth: null }));
    console.info(`Failed startup connection gateway: ${errorMessage}`);
    shutdown();
    return;
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  httpServer = serve(
    {
      fetch: app.fetch,
      port: gatewayEnv.CONNECTION_GATEWAY_PORT
    },
    (info) => {
      logger.info(`Connection Gateway HTTP server is listening at http://0.0.0.0:${info.port}`);
    }
  );

  wsServer = serve(
    {
      fetch: () => new Response('Not Found', { status: 404 }),
      port: gatewayEnv.CONNECTION_GATEWAY_WS_PORT
    },
    (info) => {
      logger.info(
        `Connection Gateway WebSocket server is listening at ws://0.0.0.0:${info.port}${gatewayEnv.CONNECTION_GATEWAY_WS_PATH}`
      );
    }
  );
  wsServer.on('upgrade', (request, socket, head) => {
    deps?.websocketTransport.handleUpgrade(request, socket, head);
  });
}

if (import.meta.main) {
  await main();
}
