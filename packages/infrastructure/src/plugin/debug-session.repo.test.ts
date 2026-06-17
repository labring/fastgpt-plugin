import { describe, expect, it } from 'vitest';

import { InMemoryPluginDebugSessionRepo } from './debug-session.repo';

describe('InMemoryPluginDebugSessionRepo', () => {
  it('creates a tmbId scoped session and reuses its connect key', async () => {
    const repo = new InMemoryPluginDebugSessionRepo('secret');
    const now = Date.now();
    const { session, connectKey } = await repo.create({
      tmbId: 'tmb-1',
      ttlMs: 60_000,
      connectKeyTtlMs: 10_000,
      now
    });

    expect(session.source).toBe(`debug:tmbId:tmb-1:session:${session.debugSessionId}`);
    await expect(repo.exchangeConnectKey(connectKey, now + 1)).resolves.toEqual({ session });
    await expect(repo.exchangeConnectKey(connectKey, now + 2)).resolves.toEqual({ session });
  });

  it('keeps only one active connect key per tmbId', async () => {
    const repo = new InMemoryPluginDebugSessionRepo('secret');
    const first = await repo.create({
      tmbId: 'tmb-1',
      ttlMs: 60_000,
      connectKeyTtlMs: 10_000,
      now: 1_000
    });
    const second = await repo.create({
      tmbId: 'tmb-1',
      ttlMs: 60_000,
      connectKeyTtlMs: 10_000,
      now: 2_000
    });

    expect(second.revokedSession).toMatchObject({
      debugSessionId: first.session.debugSessionId,
      status: 'revoked'
    });
    await expect(repo.exchangeConnectKey(first.connectKey, 2_001)).rejects.toThrow(
      'Debug session connect key not found'
    );
    await expect(repo.exchangeConnectKey(second.connectKey, 2_001)).resolves.toMatchObject({
      session: {
        debugSessionId: second.session.debugSessionId
      }
    });
  });
});
