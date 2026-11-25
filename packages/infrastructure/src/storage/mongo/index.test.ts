import type { ClientSession } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';

import { MongoClient } from './index';

const createMockSession = (overrides?: {
  inTransaction?: () => boolean;
  abortTransaction?: () => Promise<void>;
  commitTransaction?: () => Promise<void>;
  endSession?: () => Promise<void>;
}) => {
  let active = false;

  const session = {
    startTransaction: vi.fn(() => {
      active = true;
    }),
    inTransaction: vi.fn(overrides?.inTransaction ?? (() => active)),
    commitTransaction: vi.fn(
      overrides?.commitTransaction ??
        (async () => {
          active = false;
        })
    ),
    abortTransaction: vi.fn(
      overrides?.abortTransaction ??
        (async () => {
          active = false;
        })
    ),
    endSession: vi.fn(
      overrides?.endSession ??
        (async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        })
    )
  };

  return session;
};

const createClientWithSession = (session: ReturnType<typeof createMockSession>) => {
  const client = new MongoClient();
  const startSession = vi.spyOn(client.Mongo, 'startSession').mockResolvedValue(
    session as unknown as ClientSession
  );
  const loggerWarn = vi.spyOn((client as unknown as { _logger: { warn: (...args: unknown[]) => void } })._logger, 'warn');

  return { client, startSession, loggerWarn };
};

describe('MongoClient.sessionRun', () => {
  it('commits transaction, ends session, and returns callback result on success', async () => {
    const session = createMockSession();
    const { client } = createClientWithSession(session);

    const result = await client.sessionRun(async (s) => {
      expect(s).toBe(session);
      return 'ok';
    }, { timeout: 1234 });

    expect(result).toBe('ok');
    expect(session.startTransaction).toHaveBeenCalledWith({ maxCommitTimeMS: 1234 });
    expect(session.commitTransaction).toHaveBeenCalledTimes(1);
    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  it('aborts active transaction and rethrows without triggering unhandledRejection when callback fails', async () => {
    const session = createMockSession();
    const { client, loggerWarn } = createClientWithSession(session);

    const unhandledRejections: unknown[] = [];
    const onUnhandledRejection = (reason: unknown) => {
      unhandledRejections.push(reason);
    };
    process.on('unhandledRejection', onUnhandledRejection);

    try {
      await expect(
        client.sessionRun(async () => {
          throw new Error('Plugin not found');
        }, {})
      ).rejects.toThrow('Plugin not found');

      // Allow a tick for any delayed unhandledRejection callbacks to fire.
      await new Promise((resolve) => setTimeout(resolve, 20));
    } finally {
      process.off('unhandledRejection', onUnhandledRejection);
    }

    expect(unhandledRejections).toEqual([]);
    expect(session.commitTransaction).not.toHaveBeenCalled();
    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it('skips abortTransaction and logs warning when session is not in a transaction', async () => {
    const session = createMockSession({
      inTransaction: () => false
    });
    const { client, loggerWarn } = createClientWithSession(session);

    await expect(
      client.sessionRun(async () => {
        throw new Error('Outside transaction failure');
      }, {})
    ).rejects.toThrow('Outside transaction failure');

    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(loggerWarn).toHaveBeenCalledWith(
      expect.stringContaining('Uncaught mongo session error'),
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Outside transaction failure'
        })
      })
    );
  });

  it('preserves original error and ends session even if abortTransaction fails', async () => {
    const abortError = new Error('Abort failed');
    const session = createMockSession({
      abortTransaction: async () => {
        throw abortError;
      }
    });
    const { client, loggerWarn } = createClientWithSession(session);

    await expect(
      client.sessionRun(async () => {
        throw new Error('Original failure');
      }, {})
    ).rejects.toThrow('Original failure');

    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(loggerWarn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to abort mongo transaction'),
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Abort failed'
        })
      })
    );
  });
});
