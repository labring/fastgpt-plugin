import z from 'zod';

import type { I18nStringType } from '@domain/value-objects/i18n-string.vo';

export const HTTPMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
export const HTTPMethodEnum = HTTPMethodSchema.enum;
export type HTTPMethodType = keyof typeof HTTPMethodEnum;

export const StatusCodeSchema = z.number().min(100).max(599);
export type StatusCodeType = z.infer<typeof StatusCodeSchema>;

export const QuerySchema = z.record(z.string(), z.string());
export const BodySchema = z.unknown();

export type BasicResponseType = {
  error?: I18nStringType;
  data?: unknown;
};

function buildResponse<S extends number>(input: {
  status: S;
}): {
  status: S;
};
function buildResponse<S extends number, D>(input: {
  status: S;
  data: D;
}): {
  status: S;
  contentType: 'application/json';
  body: { data: D };
};
function buildResponse<S extends number, E extends I18nStringType>(input: {
  status: S;
  error: E;
}): {
  status: S;
  contentType: 'application/json';
  body: { error: E };
};
function buildResponse<S extends number, D, E extends I18nStringType>(input: {
  status: S;
  data: D;
  error: E;
}): {
  status: S;
  contentType: 'application/json';
  body: { data: D; error: E };
};
function buildResponse<S extends number, D, E extends I18nStringType>({
  status,
  error,
  data
}: {
  status: S;
  error?: E;
  data?: D;
}) {
  if (error !== undefined || data !== undefined) {
    return {
      status,
      contentType: 'application/json' as const,
      body: {
        ...(error !== undefined ? { error } : {}),
        ...(data !== undefined ? { data } : {})
      }
    };
  }

  return {
    status
  };
}

function buildSuccessResponse(): {
  status: 200;
};

function buildSuccessResponse<D>(data: D): {
  status: 200;
  contentType: 'application/json';
  body: { data: D };
};

function buildSuccessResponse<D>(data?: D) {
  if (data === undefined) {
    return buildResponse({ status: 200 });
  }

  return buildResponse({ status: 200, data });
}

function buildErrorResponse<C extends number, E extends I18nStringType>(
  statusCode: C,
  error: E
): {
  status: C;
  contentType: 'application/json';
  body: { error: E };
};
function buildErrorResponse<C extends number>(
  statusCode: C,
  error: z.ZodError
): {
  status: C;
  contentType: 'application/json';
  body: { error: I18nStringType };
};
function buildErrorResponse<C extends number>(
  statusCode: C,
  error: I18nStringType | z.ZodError
) {
  const normalizedError = error instanceof z.ZodError ? zodErrorToI18nString(error) : error;
  return buildResponse({ status: statusCode, error: normalizedError });
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

export const R = {
  response: buildResponse,
  success: buildSuccessResponse,
  fail: buildErrorResponse
};
