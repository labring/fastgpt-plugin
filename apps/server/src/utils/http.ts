import { isNotNil } from 'es-toolkit';
import type { Context, Env } from 'hono';
import { z, OpenAPIHono, type OpenAPIHonoOptions } from '@hono/zod-openapi';
import { getContext } from '@/lib/logger';

export interface Result<T = unknown> {
  code: number;
  msg: string;
  data: T | null;
}

// OpenAPI response schema builder
export const createResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    code: z.number().openapi({ example: 0 }),
    msg: z.string().openapi({ example: 'success' }),
    data: dataSchema.nullable()
  });

// Error response schema for OpenAPI
export const ErrorResponseSchema = z.object({
  code: z.number().openapi({ example: 400 }),
  msg: z.string().openapi({ example: 'error message' }),
  data: z.null()
});

// Type for success response
export type SuccessResult<T> = {
  code: 0;
  msg: 'success';
  data: T | null;
};

// Type for error response
export type ErrorResult = {
  code: number;
  msg: string;
  data: null;
};

export const R = {
  /**
   * Create a success response object
   */
  success<T>(data: T): SuccessResult<T> {
    return {
      code: 0,
      msg: 'success',
      data
    };
  },

  /**
   * Create an error response object
   */
  error(code: number, msg: string): ErrorResult {
    return {
      code,
      msg,
      data: null
    };
  },

  /**
   * Return a success JSON response
   */
  ok<T>(c: Context, data: T) {
    return c.json(this.success(data));
  },

  /**
   * Return an error JSON response
   */
  fail(c: Context, params?: { code?: number; msg?: string }) {
    const { code = -1, msg = 'error' } = params ?? {};
    return c.json(this.error(code, msg));
  }
};

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
        return c.json(R.error(400, `Invalid parameters. Please check: ${fields}`), 400);
      }
    },
    ...options
  });
}

export function getTracingHeaders(): Record<string, string> {
  const ctx = getContext();
  const requestId = ctx?.requestId as string | undefined;

  return requestId ? { 'X-Request-Id': requestId } : {};
}
