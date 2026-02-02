import type { ClientSession } from 'mongoose';
import { connectionMongo } from './index';
import { getLogger, infra } from '@/logger';

const logger = getLogger(infra.mongo);

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
      logger.warn('Uncaught mongo session error', { error });
    }
    return Promise.reject(error);
  } finally {
    await session.endSession();
  }
};
