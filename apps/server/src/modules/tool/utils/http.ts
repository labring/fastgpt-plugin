import { getContext } from '@/lib/logger';

export function getTracingHeaders(): Record<string, string> {
  const ctx = getContext();
  const requestId = ctx?.requestId as string | undefined;

  return requestId ? { 'X-Request-Id': requestId } : {};
}
