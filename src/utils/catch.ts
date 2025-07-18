/**
 * Golang style error handling
 * @param fn
 * @returns [result, error]
 */
export async function catchError<T>(fn: () => T): Promise<[T | null, unknown]> {
  try {
    return [await fn(), null];
  } catch (e) {
    return [null, e];
  }
}
