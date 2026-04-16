import type { I18nStringType } from './i18n-string.vo';

/** usecase, interface-adapter 都要使用这个类型， 手动处理错误，并且能从内到外把错误透出来*/
export type ResultFailure<E = unknown> = {
  reason: I18nStringType;
  error: E;
};

export type Result<T = unknown, E = unknown> = [T, null] | [null, ResultFailure<E>];

export const successResult = <T>(data: T): Result<T, never> => [data, null];

export function failureResult<E = unknown>(failure: ResultFailure<E>): Result<never, E>;
export function failureResult(reason: I18nStringType): Result<never, undefined>;
export function failureResult<E = unknown>(reason: I18nStringType, error: E): Result<never, E>;
export function failureResult<E = unknown>(
  reasonOrFailure: I18nStringType | ResultFailure<E>,
  error?: E
): Result<never, E | undefined> {
  if (isResultFailure(reasonOrFailure)) {
    return [null, reasonOrFailure];
  }

  return [
    null,
    {
      reason: reasonOrFailure,
      error
    }
  ];
}

function isResultFailure<E>(value: unknown): value is ResultFailure<E> {
  return Boolean(value && typeof value === 'object' && 'reason' in value && 'error' in value);
}
