import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const port = Number.parseInt(process.env.PORT ?? '8080', 10);
const host = process.env.HOST ?? '0.0.0.0';
const distDir = resolve('dist');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function readRuntimeConfig() {
  return {
    baseUrl: process.env.RUNTIME_BASE_URL ?? process.env.RUNTIME_BASEURL ?? '',
    token: process.env.RUNTIME_TOKEN ?? '',
    metricsPath: process.env.RUNTIME_METRICS_PATH ?? '/api/runtime/metrics',
    pollIntervalMs: process.env.RUNTIME_POLL_INTERVAL_MS ?? '3000'
  };
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);

  res.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': contentTypes['.json']
  });
  res.end(body);
}

function sendText(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': contentTypes['.txt']
  });
  res.end(body);
}

function resolveStaticPath(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const safePath = normalize(decodedPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = resolve(join(distDir, safePath));

  if (filePath !== distDir && !filePath.startsWith(`${distDir}${sep}`)) {
    return null;
  }

  return filePath;
}

async function serveFile(res, filePath) {
  const fileStat = await stat(filePath);

  if (!fileStat.isFile()) {
    sendText(res, 404, 'Not found');
    return;
  }

  const contentType = contentTypes[extname(filePath)] ?? 'application/octet-stream';
  res.writeHead(200, {
    'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
    'Content-Length': fileStat.size,
    'Content-Type': contentType
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

    if (url.pathname === '/health') {
      sendJson(res, 200, { status: 'ok' });
      return;
    }

    if (url.pathname === '/runtime-config.json') {
      sendJson(res, 200, readRuntimeConfig());
      return;
    }

    const filePath = resolveStaticPath(url.pathname === '/' ? '/index.html' : url.pathname);

    if (!filePath) {
      sendText(res, 403, 'Forbidden');
      return;
    }

    if (existsSync(filePath)) {
      await serveFile(res, filePath);
      return;
    }

    await serveFile(res, join(distDir, 'index.html'));
  } catch (error) {
    console.error(error);
    sendText(res, 500, 'Internal server error');
  }
});

server.listen(port, host, () => {
  console.log(`Debug runtime monitor listening on ${host}:${port}`);
});
