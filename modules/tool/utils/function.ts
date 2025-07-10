import { delay } from '@tool/utils/delay';

export const retryFn = async <T>(fn: () => Promise<T>, retryTimes = 3): Promise<T> => {
  try {
    return fn();
  } catch (error) {
    if (retryTimes > 0) {
      await delay(500);
      return retryFn(fn, retryTimes - 1);
    }
    return Promise.reject(error);
  }
};
