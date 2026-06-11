import { serializeError } from '@domain/value-objects/error.vo';
import type { ResultFailure } from '@domain/value-objects/result.vo';

export function toUsecaseErrorLog(
  failure: ResultFailure,
  context: Record<string, unknown> = {}
): Record<string, unknown> {
  return redactForLog({
    ...context,
    reason: failure.reason,
    ...(failure.code !== undefined ? { code: failure.code } : {}),
    ...(failure.message !== undefined ? { message: failure.message } : {}),
    ...(failure.data !== undefined ? { data: failure.data } : {}),
    error: serializeError(failure.error, { includeStack: true })
  }) as Record<string, unknown>;
}

export function isResultFailure(value: unknown): value is ResultFailure {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'reason' in value &&
      'error' in value &&
      (value as { error?: unknown }).error instanceof Error
  );
}

function redactForLog(value: unknown, key?: string, depth = 0): unknown {
  if (key && isSensitiveKey(key)) {
    return '[redacted]';
  }

  if (isFileLike(value)) {
    return '[omitted:file]';
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
