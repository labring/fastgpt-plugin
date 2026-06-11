import type { Context } from 'hono';

import { serializeError } from '@domain/value-objects/error.vo';

const MAX_BODY_CHARS = 64 * 1024;
const MAX_STRING_CHARS = 4 * 1024;

type BodySnapshot =
  | {
      kind: 'empty';
    }
  | {
      kind: 'omitted';
      reason: string;
      contentType?: string;
      contentLength?: number;
    }
  | {
      kind: 'readable';
      contentType: string;
      request: Request;
    };

export type HttpRequestBodySnapshot = {
  read(): Promise<unknown>;
};

export type HttpRequestLogContext = {
  method: string;
  path: string;
  query?: unknown;
  headers: {
    contentType?: string;
    contentLength?: string;
    accept?: string;
    userAgent?: string;
  };
  body?: unknown;
};

export function createHttpRequestBodySnapshot(request: Request): HttpRequestBodySnapshot {
  const snapshot = createBodySnapshot(request);
  let cachedBody: Promise<unknown> | undefined;

  return {
    read: async () => {
      cachedBody ??= readBodySnapshot(snapshot);
      return cachedBody;
    }
  };
}

export async function buildHttpRequestLogContext(
  c: Context,
  bodySnapshot?: HttpRequestBodySnapshot
): Promise<HttpRequestLogContext> {
  const url = new URL(c.req.url);
  const query = toQueryObject(url.searchParams);
  const body = await bodySnapshot?.read();

  return {
    method: c.req.method,
    path: c.req.path,
    ...(Object.keys(query).length > 0 ? { query: redactForLog(query) } : {}),
    headers: {
      ...(c.req.header('content-type') ? { contentType: c.req.header('content-type') } : {}),
      ...(c.req.header('content-length') ? { contentLength: c.req.header('content-length') } : {}),
      ...(c.req.header('accept') ? { accept: c.req.header('accept') } : {}),
      ...(c.req.header('user-agent') ? { userAgent: c.req.header('user-agent') } : {})
    },
    ...(body !== undefined ? { body } : {})
  };
}

function createBodySnapshot(request: Request): BodySnapshot {
  if (!methodCanHaveBody(request.method)) {
    return { kind: 'empty' };
  }

  const contentType = request.headers.get('content-type') ?? '';
  const contentLength = parseContentLength(request.headers.get('content-length'));

  if (!contentType && !contentLength) {
    return { kind: 'empty' };
  }

  if (contentLength !== undefined && contentLength > MAX_BODY_CHARS) {
    return {
      kind: 'omitted',
      reason: 'body_too_large',
      contentType,
      contentLength
    };
  }

  if (isMultipart(contentType)) {
    return {
      kind: 'omitted',
      reason: 'multipart_body_omitted',
      contentType,
      contentLength
    };
  }

  if (!isReadableContentType(contentType)) {
    return {
      kind: 'omitted',
      reason: 'unsupported_body_content_type',
      contentType,
      contentLength
    };
  }

  return {
    kind: 'readable',
    contentType,
    request: request.clone()
  };
}

async function readBodySnapshot(snapshot: BodySnapshot): Promise<unknown> {
  if (snapshot.kind === 'empty') {
    return undefined;
  }

  if (snapshot.kind === 'omitted') {
    return {
      omitted: true,
      reason: snapshot.reason,
      ...(snapshot.contentType ? { contentType: snapshot.contentType } : {}),
      ...(snapshot.contentLength !== undefined ? { contentLength: snapshot.contentLength } : {})
    };
  }

  try {
    const { text, truncated } = await readBodyText(snapshot.request);
    if (!text) {
      return undefined;
    }

    if (truncated || text.length > MAX_BODY_CHARS) {
      return {
        omitted: true,
        reason: 'body_too_large',
        contentType: snapshot.contentType,
        preview: text.slice(0, MAX_STRING_CHARS)
      };
    }

    return parseBodyText(text, snapshot.contentType);
  } catch (error) {
    return {
      omitted: true,
      reason: 'body_read_failed',
      error: serializeError(error)
    };
  }
}

function parseBodyText(text: string, contentType: string): unknown {
  if (isJson(contentType)) {
    try {
      return redactForLog(JSON.parse(text));
    } catch {
      return redactForLog(text);
    }
  }

  if (contentType.toLowerCase().includes('application/x-www-form-urlencoded')) {
    return redactForLog(toQueryObject(new URLSearchParams(text)));
  }

  return redactForLog(text);
}

function toQueryObject(searchParams: URLSearchParams): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};

  for (const [key, value] of searchParams.entries()) {
    const current = result[key];
    if (current === undefined) {
      result[key] = value;
      continue;
    }
    result[key] = Array.isArray(current) ? [...current, value] : [current, value];
  }

  return result;
}

function redactForLog(value: unknown, key?: string, depth = 0): unknown {
  if (key && isSensitiveKey(key)) {
    return '[redacted]';
  }

  if (isFileLike(value)) {
    return '[omitted:file]';
  }

  if (typeof value === 'string') {
    return value.length > MAX_STRING_CHARS ? `${value.slice(0, MAX_STRING_CHARS)}...` : value;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (depth > 8) {
    return '[omitted:max-depth]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactForLog(item, key, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
      entryKey,
      redactForLog(entryValue, entryKey, depth + 1)
    ])
  );
}

function methodCanHaveBody(method: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

function isReadableContentType(contentType: string): boolean {
  const normalizedContentType = contentType.toLowerCase();
  return (
    isJson(normalizedContentType) ||
    normalizedContentType.includes('application/x-www-form-urlencoded') ||
    normalizedContentType.startsWith('text/')
  );
}

function isJson(contentType: string): boolean {
  const normalizedContentType = contentType.toLowerCase();
  return normalizedContentType.includes('application/json') || normalizedContentType.includes('+json');
}

function isMultipart(contentType: string): boolean {
  return contentType.toLowerCase().includes('multipart/form-data');
}

function parseContentLength(contentLength: string | null): number | undefined {
  if (!contentLength) {
    return undefined;
  }

  const parsed = Number(contentLength);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function isSensitiveKey(key: string): boolean {
  return /^(authorization|token|accessToken|refreshToken|apiKey|api_key|secret|secrets|password|privateKey|invokeToken)$/i.test(
    key
  );
}

function isFileLike(value: unknown): boolean {
  return (
    (typeof File !== 'undefined' && value instanceof File) ||
    (typeof Blob !== 'undefined' && value instanceof Blob) ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    (typeof ReadableStream !== 'undefined' && value instanceof ReadableStream)
  );
}

async function readBodyText(request: Request): Promise<{ text: string; truncated: boolean }> {
  if (!request.body) {
    return {
      text: await request.text(),
      truncated: false
    };
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let truncated = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      text += decoder.decode(value, { stream: true });
      if (text.length > MAX_BODY_CHARS) {
        truncated = true;
        await reader.cancel().catch(() => undefined);
        break;
      }
    }

    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  return { text, truncated };
}
