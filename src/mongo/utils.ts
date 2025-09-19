import type { ClientSession } from 'mongoose';
import { connectionMongo } from './index';
import { addLog } from '@/utils/log';

const timeout = 60000;

export const mongoSessionRun = async <T = unknown>(fn: (session: ClientSession) => Promise<T>) => {
  const session = await connectionMongo.startSession();

  try {
    session.startTransaction({
      maxCommitTimeMS: timeout
    });
    const result = await fn(session);

    await session.commitTransaction();

    return result as T;
  } catch (error) {
    if (!session.inTransaction()) {
      await session.abortTransaction();
    } else {
      addLog.warn('Uncaught mongo session error', { error });
    }
    return Promise.reject(error);
  } finally {
    await session.endSession();
  }
};
