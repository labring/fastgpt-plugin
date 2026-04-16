import { OpenAPIHono, type OpenAPIHonoOptions } from '@hono/zod-openapi';
import { isNotNil } from 'es-toolkit';
import type { Context, Env } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import z from 'zod';

import type { I18nStringType } from '@domain/value-objects/i18n-string.vo';

type ResponseContextLike = Pick<Context, 'json' | 'body'>;

export function appendHeaders(headers: Headers, appendHeaders?: HeadersInit) {
  const h = new Headers(headers);
  if (isNotNil(appendHeaders)) {
    const ah = new Headers(appendHeaders);
    ah.forEach((v, k) => void h.append(k, v));
  }
  return h;
}

function zodErrorToI18nString(error: z.ZodError): I18nStringType {
  const details = error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `${path}: ${issue.message}`;
    })
    .join('; ');

  return {
    en: details ? `Validation failed: ${details}` : 'Validation failed',
    'zh-CN': details ? `数据校验失败: ${details}` : '数据校验失败'
  };
}

function normalizeError(error: I18nStringType | z.ZodError | string): I18nStringType {
  if (error instanceof z.ZodError) {
    return zodErrorToI18nString(error);
  }

  if (typeof error === 'string') {
    return {
      en: error,
      'zh-CN': error
    };
  }

  return error;
}

function success<T>(c: ResponseContextLike, data: T) {
  return c.json({ data }, 200);
}

function empty(c: ResponseContextLike) {
  return c.body(null, 200);
}

function fail<S extends ContentfulStatusCode>(
  c: ResponseContextLike,
  status: S,
  error: I18nStringType | z.ZodError | string
) {
  return c.json({ error: normalizeError(error) }, status);
}

export const R = {
  success,
  empty,
  fail,
  error: fail
};

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
        return R.fail(c, 400, {
          en: fields
        });
      }
    },
    ...options
  });
}
