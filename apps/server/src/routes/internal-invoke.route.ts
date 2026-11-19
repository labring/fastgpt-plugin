import type { InvokePort } from '@domain/ports/invoke.port';
import { InvokeUploadFileOutputSchema, InvokeUserInfoOutputSchema } from '@domain/ports/invoke.port';
import { MIMESchema } from '@domain/value-objects/file/MIME.vo';
import { createOpenAPIHono } from '@infrastructure/hono/utils/response';
import { InternalPluginInvokeForbiddenError, InternalPluginInvokeTokenService } from '@infrastructure/plugin/invoke/internal-invoke-token.service';
import { InvokeManager } from '@infrastructure/plugin/invoke/invoke.impl';

const FILE_NAME_HEADER = 'x-fastgpt-file-name';

export type InternalInvokeRouteDeps = {
  tokenService: InternalPluginInvokeTokenService;
  fastgptBaseUrl: string;
  maxUploadBytes: number;
  invokeManagerFactory?: (token: string, signal: AbortSignal) => InvokePort;
};

export function makeInternalInvokeRoute(deps: InternalInvokeRouteDeps) {
  const route = createOpenAPIHono();
  if (!Number.isSafeInteger(deps.maxUploadBytes) || deps.maxUploadBytes <= 0) throw new Error('Invalid upload limit');
  route.use('*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  // Never expose upstream exceptions, credentials or response bodies.
  route.onError(() => Response.json({ error: 'Host invoke failed' }, { status: 502, headers: { 'Cache-Control': 'no-store' } }));
  const invokeManager = (claims: { invokeToken: string; exp: number }, request: Request) => {
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(Math.max(0, claims.exp - Date.now()))]);
    signal.throwIfAborted();
    return deps.invokeManagerFactory?.(claims.invokeToken, signal) ?? new InvokeManager({
      token: claims.invokeToken, fastgptBaseUrl: deps.fastgptBaseUrl, signal
    });
  };

  route.post('/v1/userInfo', async (c) => {
    const claims = verifyRequest(c.req.header('Authorization'), deps, 'userInfo', c.req.raw);
    if (claims instanceof Response) return claims;
    const result = await invokeManager(claims, c.req.raw).userInfo();
    if (result[1]) return c.json({ error: 'Host invoke failed', code: result[1].code }, 502);
    const parsed = InvokeUserInfoOutputSchema.safeParse(result[0]);
    return parsed.success ? c.json([parsed.data, null]) : c.json({ error: 'Invalid host response' }, 502);
  });

  route.post('/v1/wecomCorpToken', async (c) => {
    const claims = verifyRequest(c.req.header('Authorization'), deps, 'wecomCorpToken', c.req.raw);
    if (claims instanceof Response) return claims;
    const result = await invokeManager(claims, c.req.raw).getWecomCorpToken();
    if (result[1]) return c.json({ error: 'Host invoke failed', code: result[1].code }, 502);
    if (!result[0] || typeof result[0].access_token !== 'string' || !Number.isFinite(result[0].expires_in)) {
      return c.json({ error: 'Invalid host response' }, 502);
    }
    return c.json([{ access_token: result[0].access_token, expires_in: result[0].expires_in }, null]);
  });

  route.post('/v1/uploadFile', async (c) => {
    const claims = verifyRequest(c.req.header('Authorization'), deps, 'uploadFile', c.req.raw);
    if (claims instanceof Response) return claims;

    const rawName = c.req.header(FILE_NAME_HEADER);
    let fileName: string | undefined;
    try {
      fileName = rawName ? decodeURIComponent(rawName) : undefined;
    } catch {
      return c.json({ error: 'Invalid file name' }, 400);
    }
    if (fileName && (fileName.length > 255 || /[\\/]/.test(fileName) || [...fileName].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127))) {
      return c.json({ error: 'Invalid file name' }, 400);
    }

    let file: Buffer;
    try {
      file = await readRequestBody(c.req.raw, deps.maxUploadBytes, claims.exp);
    } catch (error) {
      if (error instanceof UploadTooLargeError) return c.json({ error: 'Uploaded file is too large' }, 413);
      if (claims.exp <= Date.now()) return c.json({ error: 'Unauthorized' }, 401);
      return c.json({ error: 'Invalid upload body' }, 400);
    }

    if (claims.exp <= Date.now()) return c.json({ error: 'Unauthorized' }, 401);
    const contentType = MIMESchema.safeParse(c.req.header('Content-Type')?.split(';', 1)[0]?.trim() || 'application/octet-stream');
    if (!contentType.success) return c.json({ error: 'Unsupported content type' }, 400);
    const result = await invokeManager(claims, c.req.raw).uploadFile({
      file,
      ...(fileName ? { fileName } : {}),
      contentType: contentType.data
    });
    if (result[1]) return c.json({ error: 'Host invoke failed', code: result[1].code }, 502);
    const parsed = InvokeUploadFileOutputSchema.safeParse(result[0]);
    return parsed.success ? c.json([parsed.data, null]) : c.json({ error: 'Invalid host response' }, 502);
  });

  return route;
}

function verifyRequest(
  authorization: string | undefined,
  deps: InternalInvokeRouteDeps,
  method: string,
  request: Request
) {
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(authorization ?? '');
  const tenantId = request.headers.get('x-fastgpt-tenant-id');
  const pluginId = request.headers.get('x-fastgpt-plugin-id');
  const invocationId = request.headers.get('x-fastgpt-invocation-id');
  if (!match || !tenantId || !pluginId || !invocationId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return deps.tokenService.verify(match[1], {
      method,
      tenantId, pluginId, invocationId
    });
  } catch (error) {
    return error instanceof InternalPluginInvokeForbiddenError
      ? Response.json({ error: 'Forbidden' }, { status: 403 })
      : Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

async function readRequestBody(request: Request, maximumBytes: number, expiresAt: number): Promise<Buffer> {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes <= 0) throw new Error('Invalid upload limit');
  const declaredSize = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredSize) && declaredSize > maximumBytes) throw new UploadTooLargeError();
  if (!request.body) return Buffer.alloc(0);

  const reader = request.body.getReader();
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(Math.max(0, expiresAt - Date.now()))]);
  const onAbort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', onAbort, { once: true });
  const chunks: Buffer[] = [];
  let bytes = 0;
  try {
    signal.throwIfAborted();
    while (true) {
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maximumBytes) {
        void reader.cancel().catch(() => {});
        throw new UploadTooLargeError();
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    signal.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }
  return Buffer.concat(chunks, bytes);
}

class UploadTooLargeError extends Error {}
