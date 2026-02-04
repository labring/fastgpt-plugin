export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Golang style error handling
 * @param fn
 * @returns [result, error]
 */
export async function catchError<T>(fn: () => T): Promise<[Awaited<T> | null, unknown]> {
  try {
    return [await fn(), null];
  } catch (e) {
    return [null, e];
  }
}

export const retryFn = async <T>(fn: () => Promise<T>, retryTimes = 3): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retryTimes > 0) {
      await delay(500);
      return retryFn(fn, retryTimes - 1);
    }
    return Promise.reject(error);
  }
};

/**
 * Run batch tasks concurrently with a maximum number of concurrent tasks.
 * @param batchSize Maximum number of concurrent tasks.
 * @param funclist List of functions to run in batches.
 * @returns Array of results from the functions.
 */
export async function batch<T>(batchSize: number, funclist: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const func of funclist) {
    const promise = func().then((result) => {
      results.push(result);
      // Remove this promise from executing when done
      executing.splice(executing.indexOf(promise), 1);
    });

    executing.push(promise);

    // If we reached batchSize, wait for one to finish
    if (executing.length >= batchSize) {
      await Promise.race(executing);
    }
  }

  // Wait for all remaining promises to complete
  await Promise.all(executing);

  return results;
}
