export type Result<T = unknown, E = Error> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: E;
    };

export const successResult = <T>(data: T): Result<T> => ({ success: true, data });
export const failureResult = (msg: string, error?: unknown): Result<never, Error> => ({
  success: false,
  error: error
    ? new Error(msg, {
        cause: error
      })
    : new Error(msg)
});
