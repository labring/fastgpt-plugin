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
