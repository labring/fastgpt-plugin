import { isNotNil } from 'es-toolkit';
import type { Env } from 'hono';
import { OpenAPIHono, type OpenAPIHonoOptions } from '@hono/zod-openapi';
import { R } from '@interface-adapter/http/http.type';

export function appendHeaders(headers: Headers, appendHeaders?: HeadersInit) {
  const h = new Headers(headers);
  if (isNotNil(appendHeaders)) {
    const ah = new Headers(appendHeaders);
    ah.forEach((v, k) => void h.append(k, v));
  }
  return h;
}

/**
 * Create OpenAPIHono instance with default validation hook
 */
export function createOpenAPIHono<T extends Env = Env>(options?: OpenAPIHonoOptions<T>) {
  return new OpenAPIHono<T>({
    defaultHook: (result, c) => {
      if (!result.success) {
        const issues = result.error.issues;
        if (issues.length === 0) {
          throw new Error('Unknown Zod error');
        }

        const paths = [];
        for (const issue of issues) {
          if (issue.path) {
            paths.push(...issue.path.flat());
          }
        }
        const fields = Array.from(new Set(paths)).filter(isNotNil).join(', ');
        return c.json(
          R.fail(400, {
            en: fields
          })
        );
      }
    },
    ...options
  });
}
