import { createReasonError, getErrorReason, normalizeToError, serializeError } from './error.vo';
import type { I18nStringType } from './i18n-string.vo';

/** usecase, interface-adapter 都要使用这个类型， 手动处理错误，并且能从内到外把错误透出来*/
export type ResultFailure<E extends Error = Error> = {
  reason: I18nStringType;
  error: E;
  code?: string;
  message?: string;
  data?: unknown;
};

export type Result<T = unknown, E extends Error = Error> = [T, null] | [null, ResultFailure<E>];

export const successResult = <T>(data: T): Result<T, never> => [data, null];

export function failureResult<E extends Error = Error>(failure: ResultFailure<E>): Result<never, E>;
export function failureResult<E extends Error = Error>(error: E): Result<never, E>;
export function failureResult(reason: I18nStringType): Result<never, Error>;
export function failureResult(reason: I18nStringType, error: unknown): Result<never, Error>;
export function failureResult<E extends Error = Error>(
  reasonOrFailure: I18nStringType | ResultFailure<E> | E,
  error?: unknown
): Result<never, E | Error> {
  if (isResultFailure(reasonOrFailure)) {
    return [null, toResultFailure(reasonOrFailure.reason, reasonOrFailure.error, reasonOrFailure)];
  }

  if (reasonOrFailure instanceof Error) {
    return [null, toResultFailure(getErrorReason(reasonOrFailure), reasonOrFailure)];
  }

  const normalizedError =
    error === undefined
      ? createReasonError(reasonOrFailure)
      : createLegacyFailureError(reasonOrFailure, error);
  return [null, toResultFailure(reasonOrFailure, normalizedError)];
}

function isResultFailure<E extends Error>(value: unknown): value is ResultFailure<E> {
  return Boolean(value && typeof value === 'object' && 'reason' in value && 'error' in value);
}

function createLegacyFailureError(reason: I18nStringType, cause: unknown): Error {
  const normalizedCause = normalizeToError(cause, reason.en);
  return createReasonError(reason, { cause: normalizedCause });
}

function toResultFailure<E extends Error>(
  reason: I18nStringType,
  error: E,
  existing?: Pick<ResultFailure<E>, 'code' | 'message' | 'data'>
): ResultFailure<E> {
  const serialized = serializeError(error);
  const code = existing?.code ?? serialized.code;
  const message = existing?.message ?? serialized.message;
  const data = existing && 'data' in existing ? existing.data : serialized.data;

  return {
    reason,
    error,
    ...(code !== undefined ? { code } : {}),
    ...(message !== undefined ? { message } : {}),
    ...(data !== undefined ? { data } : {})
  };
}
