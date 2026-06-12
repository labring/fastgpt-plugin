import { defineConfig, type Plugin } from 'vite';

function readRuntimeEnv() {
  const runtimeBaseUrl = process.env.RUNTIME_BASE_URL || process.env.RUNTIME_BASEURL || '';
  const gatewayBaseUrl = process.env.CONNECTION_GATEWAY_BASE_URL || '';
  const runtimeMetricsPath = process.env.RUNTIME_METRICS_PATH || '';

  return {
    baseUrl: runtimeBaseUrl || gatewayBaseUrl,
    token: process.env.RUNTIME_TOKEN || process.env.CONNECTION_GATEWAY_AUTH_TOKEN || '',
    metricsPath: runtimeMetricsPath || (gatewayBaseUrl && !runtimeBaseUrl ? '/metrics' : '/api/runtime/metrics'),
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
  envPrefix: ['VITE_', 'RUNTIME_', 'CONNECTION_GATEWAY_'],
  server: {
    port: 5174
  },
  preview: {
    port: 4174
  }
});
