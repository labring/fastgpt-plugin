import { createReasonError, getErrorReason, normalizeToError } from './error.vo';
import type { I18nStringType } from './i18n-string.vo';

/** usecase, interface-adapter 都要使用这个类型， 手动处理错误，并且能从内到外把错误透出来*/
export type ResultFailure<E extends Error = Error> = {
  reason: I18nStringType;
  error: E;
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
    return [
      null,
      {
        reason: reasonOrFailure.reason,
        error: reasonOrFailure.error
      }
    ];
  }

  if (reasonOrFailure instanceof Error) {
    return [
      null,
      {
        reason: getErrorReason(reasonOrFailure),
        error: reasonOrFailure
      }
    ];
  }

  const normalizedError =
    error === undefined
      ? createReasonError(reasonOrFailure)
      : createLegacyFailureError(reasonOrFailure, error);
  return [
    null,
    {
      reason: reasonOrFailure,
      error: normalizedError
    }
  ];
}

function isResultFailure<E extends Error>(value: unknown): value is ResultFailure<E> {
  return Boolean(value && typeof value === 'object' && 'reason' in value && 'error' in value);
}

function createLegacyFailureError(reason: I18nStringType, cause: unknown): Error {
  const normalizedCause = normalizeToError(cause, reason.en);
  return createReasonError(reason, { cause: normalizedCause });
}
