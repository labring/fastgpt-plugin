import { defineConfig, type Plugin } from 'vite';

function readRuntimeEnv() {
  return {
    baseUrl: process.env.RUNTIME_BASE_URL ?? process.env.RUNTIME_BASEURL ?? '',
    token: process.env.RUNTIME_TOKEN ?? '',
    metricsPath: process.env.RUNTIME_METRICS_PATH ?? '/api/runtime/metrics',
    pollIntervalMs: process.env.RUNTIME_POLL_INTERVAL_MS ?? '3000'
  };
}

function runtimeConfigPlugin(): Plugin {
  const serveRuntimeConfig = (
    url: string | undefined,
    send: (payload: string) => void,
    next: () => void
  ) => {
    if ((url ?? '').split('?')[0] !== '/runtime-config.json') {
      next();
      return;
    }

    send(JSON.stringify(readRuntimeEnv()));
  };

  return {
    name: 'debug-runtime-monitor-runtime-config',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        serveRuntimeConfig(
          req.url,
          (payload) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(payload);
          },
          next
        );
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        serveRuntimeConfig(
          req.url,
          (payload) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(payload);
          },
          next
        );
      });
    }
  };
}

export default defineConfig({
  plugins: [runtimeConfigPlugin()],
  envPrefix: ['VITE_', 'RUNTIME_'],
  server: {
    port: 5174
  },
  preview: {
    port: 4174
  }
});
