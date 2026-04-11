import type { I18nStringType } from './i18n-string.vo';

/** usecase, interface-adapter 都要使用这个类型， 手动处理错误。 */
export type Result<
  T = unknown,
  E extends Result | Error = Error,
  S extends boolean = boolean
> = S extends true
  ? [T, null]
  : [
      null,
      {
        reason: I18nStringType;
        error: E;
      }
    ];

export const successResult = <T>(data: T): Result<T, never, true> => [data, null];

export const failureResult = (
  reason: I18nStringType | { reason: I18nStringType; error: Error },
  error?: unknown
): Result<never, Error, false> => {
  if (reason instanceof Object && 'reason' in reason) {
    return [
      null,
      {
        reason: reason.reason,
        error: reason.error
      }
    ];
  }
  return [
    null,
    {
      reason,
      error: error instanceof Error ? error : new Error(reason.en)
    }
  ];
};
