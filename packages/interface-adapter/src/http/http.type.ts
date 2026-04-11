import type { I18nStringType } from '@domain/value-objects/i18n-string.vo';
import z from 'zod';

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
function buildErrorResponse<C extends number, E extends I18nStringType>(statusCode: C, error: E) {
  return buildResponse({ status: statusCode, error });
}

export const R = {
  response: buildResponse,
  success: buildSuccessResponse,
  fail: buildErrorResponse
};
