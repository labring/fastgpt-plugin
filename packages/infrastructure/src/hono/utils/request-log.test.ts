import type { Context } from 'hono';
import { describe, expect, it } from 'vitest';

import { buildHttpRequestLogContext, createHttpRequestBodySnapshot } from './request-log';

function createContext(request: Request): Context {
  const url = new URL(request.url);

  return {
    req: {
      url: request.url,
      method: request.method,
      path: url.pathname,
      header: (name: string) => request.headers.get(name) ?? undefined
    }
  } as unknown as Context;
}

describe('request log context', () => {
  it('captures query parameters for failed GET requests', async () => {
    const request = new Request(
      'https://plugin.example.com/api/tool?pluginId=getTime&source=system&tag=tools&tag=search'
    );

    await expect(
      buildHttpRequestLogContext(createContext(request), createHttpRequestBodySnapshot(request))
    ).resolves.toMatchObject({
      method: 'GET',
      path: '/api/tool',
      query: {
        pluginId: 'getTime',
        source: 'system',
        tag: ['tools', 'search']
      }
    });
  });

  it('captures JSON request bodies and redacts secret fields', async () => {
    const request = new Request('https://plugin.example.com/api/tool/runStream', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        pluginId: 'getTime',
        input: {
          timezone: 'Asia/Shanghai'
        },
        secrets: {
          apiKey: 'secret-key'
        },
        systemVar: {
          invokeToken: 'invoke-token'
        }
      })
    });

    await expect(
      buildHttpRequestLogContext(createContext(request), createHttpRequestBodySnapshot(request))
    ).resolves.toMatchObject({
      method: 'POST',
      path: '/api/tool/runStream',
      body: {
        pluginId: 'getTime',
        input: {
          timezone: 'Asia/Shanghai'
        },
        secrets: '[redacted]',
        systemVar: {
          invokeToken: '[redacted]'
        }
      }
    });
  });

  it('never clones or logs reverse-invoke bodies, including text uploads', async () => {
    const request = new Request('https://plugin.internal/internal/plugin-invoke/v1/uploadFile', {
      method: 'POST', headers: { 'Content-Type': 'text/plain', Authorization: 'Bearer private-token' }, body: 'private-file'
    });
    const context = await buildHttpRequestLogContext(createContext(request), createHttpRequestBodySnapshot(request));
    expect(context.body).toEqual({ omitted: true, reason: 'internal_invoke_body_omitted' });
    expect(JSON.stringify(context)).not.toContain('private');
    expect(await request.text()).toBe('private-file');
  });

  it('omits multipart file bodies', async () => {
    const form = new FormData();
    form.append('files', new Blob(['pkg-content'], { type: 'application/octet-stream' }), 'tool.pkg');
    const request = new Request('https://plugin.example.com/api/plugin/upload', {
      method: 'POST',
      body: form
    });

    await expect(
      buildHttpRequestLogContext(createContext(request), createHttpRequestBodySnapshot(request))
    ).resolves.toMatchObject({
      method: 'POST',
      path: '/api/plugin/upload',
      body: {
        omitted: true,
        reason: 'multipart_body_omitted'
      }
    });
  });
});
