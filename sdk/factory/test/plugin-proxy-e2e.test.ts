import net from 'node:net';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import z from 'zod';

import { createToolHandler, defineTool } from '../src/index';
import { resetPluginProxyConfiguredForTest } from '../src/proxy';

describe('Plugin execution proxy integration', () => {
  const originalEnv = { ...process.env };
  let proxyServer: net.Server | null = null;
  let proxyPort = 0;
  let interceptedTargets: string[] = [];

  beforeEach(async () => {
    resetPluginProxyConfiguredForTest();
    delete process.env.HTTP_PROXY;
    delete process.env.http_proxy;
    delete process.env.HTTPS_PROXY;
    delete process.env.https_proxy;
    delete process.env.NO_PROXY;
    delete process.env.no_proxy;
    delete process.env.ALL_PROXY;
    delete process.env.all_proxy;

    interceptedTargets = [];
    proxyServer = net.createServer((socket) => {
      socket.once('data', (chunk) => {
        const text = chunk.toString();
        if (text.startsWith('CONNECT')) {
          const target = text.split('\r\n')[0].split(' ')[1] ?? '';
          interceptedTargets.push(target);
          socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          socket.on('data', () => {
            const body = JSON.stringify({ fromProxyServer: true });
            socket.write(
              `HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`
            );
          });
        }
      });
    });

    await new Promise<void>((resolve) => {
      proxyServer?.listen(0, '127.0.0.1', () => {
        proxyPort = (proxyServer?.address() as net.AddressInfo).port;
        resolve();
      });
    });
  });

  afterEach(async () => {
    resetPluginProxyConfiguredForTest();
    process.env = { ...originalEnv };
    if (proxyServer) {
      await new Promise<void>((resolve) => proxyServer?.close(() => resolve()));
      proxyServer = null;
    }
  });

  it('routes fetch calls from a plugin tool handler through the configured proxy', async () => {
    process.env.HTTP_PROXY = `http://127.0.0.1:${proxyPort}`;

    const handler = createToolHandler({
      inputSchema: z.object({}),
      outputSchema: z.object({ fromProxyServer: z.boolean() }),
      handler: async () => {
        const res = await fetch('http://api.external-target.com/weather');
        return (await res.json()) as { fromProxyServer: boolean };
      }
    });

    defineTool({
      manifest: {
        pluginId: 'proxy-test-tool',
        version: '1.0.0',
        name: { en: 'Proxy Test Tool', 'zh-CN': '代理测试工具' },
        description: { en: 'Test', 'zh-CN': '测试' }
      },
      handler
    });

    const result = await handler.handler(
      {},
      {
        secrets: undefined,
        systemVar: {} as any,
        invoke: {} as any,
        streamResponse: () => {}
      }
    );

    expect(result).toEqual({ fromProxyServer: true });
    expect(interceptedTargets).toContain('api.external-target.com:80');
  });

  it('bypasses proxy when target domain matches NO_PROXY', async () => {
    process.env.HTTP_PROXY = `http://127.0.0.1:${proxyPort}`;
    process.env.NO_PROXY = 'api.internal-target.com';

    // Start a direct local target server
    let directServerHit = false;
    const directServer = net.createServer((socket) => {
      directServerHit = true;
      socket.on('data', () => {
        const body = JSON.stringify({ fromDirectServer: true });
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`
        );
      });
    });

    await new Promise<void>((resolve) => directServer.listen(0, '127.0.0.1', resolve));
    const directPort = (directServer.address() as net.AddressInfo).port;

    const handler = createToolHandler({
      inputSchema: z.object({}),
      outputSchema: z.object({ fromDirectServer: z.boolean() }),
      handler: async () => {
        const res = await fetch(`http://127.0.0.1:${directPort}/data`);
        return (await res.json()) as { fromDirectServer: boolean };
      }
    });

    defineTool({
      manifest: {
        pluginId: 'no-proxy-test-tool',
        version: '1.0.0',
        name: { en: 'No Proxy Test Tool', 'zh-CN': '免代理测试工具' },
        description: { en: 'Test', 'zh-CN': '测试' }
      },
      handler
    });

    // 127.0.0.1 is not in NO_PROXY yet, but if we add it:
    process.env.NO_PROXY = '127.0.0.1,localhost';
    resetPluginProxyConfiguredForTest();

    defineTool({
      manifest: {
        pluginId: 'no-proxy-test-tool-2',
        version: '1.0.0',
        name: { en: 'No Proxy Test Tool 2', 'zh-CN': '免代理测试工具 2' },
        description: { en: 'Test', 'zh-CN': '测试' }
      },
      handler
    });

    const result = await handler.handler(
      {},
      {
        secrets: undefined,
        systemVar: {} as any,
        invoke: {} as any,
        streamResponse: () => {}
      }
    );

    expect(result).toEqual({ fromDirectServer: true });
    expect(directServerHit).toBe(true);
    // Proxy should not have intercepted 127.0.0.1
    expect(interceptedTargets.some((t) => t.includes(`127.0.0.1:${directPort}`))).toBe(false);

    directServer.close();
  });
});
