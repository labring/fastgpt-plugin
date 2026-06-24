import { describe, expect, it } from 'vitest';

import { InMemoryPluginDebugSessionRepo } from './debug-session.repo';

describe('InMemoryPluginDebugSessionRepo', () => {
  it('creates a tmbId scoped session and consumes tickets once', async () => {
    const repo = new InMemoryPluginDebugSessionRepo('secret');
    const now = Date.now();
    const { session, ticket } = await repo.create({
      tmbId: 'tmb-1',
      ttlMs: 60_000,
      ticketTtlMs: 10_000,
      now
    });

    expect(session.source).toBe(`debug:tmbId:tmb-1:session:${session.debugSessionId}`);
    await expect(repo.exchangeTicket(ticket, now + 1)).resolves.toEqual({ session });
    await expect(repo.exchangeTicket(ticket, now + 2)).rejects.toThrow(
      'Debug session ticket not found'
    );
  });

  it('revokes the previous active session for the same tmbId', async () => {
    const repo = new InMemoryPluginDebugSessionRepo('secret');
    const first = await repo.create({
      tmbId: 'tmb-1',
      ttlMs: 60_000,
      ticketTtlMs: 10_000,
      now: 1_000
    });
    const second = await repo.create({
      tmbId: 'tmb-1',
      ttlMs: 60_000,
      ticketTtlMs: 10_000,
      now: 2_000
    });

    expect(second.revokedSession).toMatchObject({
      debugSessionId: first.session.debugSessionId,
      status: 'revoked'
    });
    await expect(repo.exchangeTicket(first.ticket, 2_001)).rejects.toThrow(
      'Debug session ticket not found'
    );
    await expect(repo.exchangeTicket(second.ticket, 2_001)).resolves.toMatchObject({
      session: {
        debugSessionId: second.session.debugSessionId
      }
    });
  });
});
