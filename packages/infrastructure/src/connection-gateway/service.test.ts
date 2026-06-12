import '@infrastructure/errors/error.registry';

import { describe, expect, it } from 'vitest';

import type { ConnectionGatewayEnvelope } from '@domain/value-objects/connection-gateway.vo';

import { InMemoryConnectionGatewayMailbox } from './mailbox';
import { InMemoryConnectionGatewayMetrics } from './metrics';
import { ConnectionGatewayResourceLimiter } from './resource-limiter';
import { ConnectionGatewayService } from './service';
import { InMemoryConnectionGatewaySessionRegistry } from './session-registry';
import { HmacConnectionGatewayToken } from './token';

const now = Date.now();

function makeService(overrides: { maxSessionsPerSubject?: number } = {}) {
  const limits = {
    maxConnections: 10,
    maxSessionsPerSubject: overrides.maxSessionsPerSubject ?? 5,
    maxInFlightPerSession: 2,
    maxEnvelopeBytes: 1024,
    slowConsumerBufferBytes: 4096
  };
  const metrics = new InMemoryConnectionGatewayMetrics('node-a', limits);

  return {
    token: new HmacConnectionGatewayToken('secret'),
    mailbox: new InMemoryConnectionGatewayMailbox(),
    service: new ConnectionGatewayService({
      tokenVerifier: new HmacConnectionGatewayToken('secret'),
      sessionRegistry: new InMemoryConnectionGatewaySessionRegistry(),
      mailbox: new InMemoryConnectionGatewayMailbox(),
      metrics,
      limiter: new ConnectionGatewayResourceLimiter(limits),
      options: {
        nodeId: 'node-a',
        sessionTtlMs: 60_000,
        ownerLeaseTtlMs: 15_000,
        mailboxBlockMs: 10,
        mailboxMaxLen: 100
      }
    }),
    metrics
  };
}

async function signDebugToken(token: HmacConnectionGatewayToken) {
  return token.sign({
    consumerType: 'plugin-debug',
    subject: 'user:u1',
    sessionScope: {
      userId: 'u1',
      source: 'debug:user:u1'
    },
    transport: 'tcp',
    capabilities: ['invoke'],
    issuedAt: now,
    expiresAt: now + 60_000
  });
}

async function signMultiSourceDebugToken(token: HmacConnectionGatewayToken) {
  return token.sign({
    consumerType: 'plugin-debug',
    subject: 'user:u1',
    sessionScope: {
      userId: 'u1',
      source: 'debug:user:u1'
    },
    transport: 'tcp',
    capabilities: ['invoke'],
    issuedAt: now,
    expiresAt: now + 60_000
  });
}

function makeEnvelope(sessionId: string, generation: number): ConnectionGatewayEnvelope {
  return {
    protocol: 'connection-gateway.v1',
    sessionId,
    generation,
    requestId: 'request-a',
    type: 'request',
    consumerType: 'plugin-debug',
    capability: 'invoke',
    createdAt: now,
    payload: { ok: true }
  };
}

describe('ConnectionGatewayService', () => {
  it('creates scoped sessions and publishes opaque envelopes to the mailbox', async () => {
    const { service, token, metrics } = makeService();
    const session = await service.createSession({
      token: await signDebugToken(token),
      transport: 'tcp',
      now
    });

    const result = await service.publishRequest({
      sessionId: session.id,
      envelope: makeEnvelope(session.id, session.generation)
    });

    await expect(service.getStatus(session.id)).resolves.toMatchObject({
      session: expect.objectContaining({
        id: session.id,
        subject: 'user:u1',
        generation: 0
      }),
      ownerAlive: true,
      mailboxLag: 1
    });
    expect(result.accepted).toBe(true);
    expect(metrics.snapshot()).toMatchObject({
      activeSessions: 1,
      mailbox: { lag: 1 }
    });
  });

  it('fails closed for stale generation, missing capability, and subject session limits', async () => {
    const { service, token } = makeService({ maxSessionsPerSubject: 1 });
    const signed = await signDebugToken(token);
    const session = await service.createSession({
      token: signed,
      transport: 'tcp',
      now
    });

    await expect(
      service.publishRequest({
        sessionId: session.id,
        envelope: makeEnvelope(session.id, session.generation + 1)
      })
    ).rejects.toMatchObject({
      code: 'connection_gateway.stale_generation'
    });

    await expect(
      service.publishRequest({
        sessionId: session.id,
        envelope: {
          ...makeEnvelope(session.id, session.generation),
          capability: 'admin'
        }
      })
    ).rejects.toMatchObject({
      code: 'connection_gateway.capability_denied'
    });

    await expect(
      service.createSession({
        token: signed,
        transport: 'tcp',
        now
      })
    ).rejects.toMatchObject({
      code: 'connection_gateway.resource_limit_exceeded'
    });
  });

  it('streams reply envelopes for a published request', async () => {
    const { service, token } = makeService();
    const session = await service.createSession({
      token: await signDebugToken(token),
      transport: 'tcp',
      now
    });
    const request = makeEnvelope(session.id, session.generation);
    const { responses } = await service.publishRequestAndWait({
      sessionId: session.id,
      envelope: request,
      timeoutMs: 1_000
    });
    const iterator = responses[Symbol.asyncIterator]();

    await service.publishResponse({
      sessionId: session.id,
      envelope: {
        ...request,
        type: 'response',
        payload: {
          kind: 'plugin-debug.accepted'
        }
      }
    });
    await service.publishResponse({
      sessionId: session.id,
      envelope: {
        ...request,
        type: 'stream',
        payload: {
          kind: 'plugin-debug.stream',
          event: 'chunk',
          data: { type: 'stream', data: { type: 'answer', content: 'hello' } }
        }
      }
    });
    await service.publishResponse({
      sessionId: session.id,
      envelope: {
        ...request,
        type: 'stream',
        payload: {
          kind: 'plugin-debug.stream',
          event: 'end'
        }
      }
    });

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: expect.objectContaining({
        type: 'response',
        payload: expect.objectContaining({ kind: 'plugin-debug.accepted' })
      })
    });
    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: expect.objectContaining({
        type: 'stream',
        payload: expect.objectContaining({ event: 'chunk' })
      })
    });
    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: expect.objectContaining({
        type: 'stream',
        payload: expect.objectContaining({ event: 'end' })
      })
    });
    await expect(iterator.next()).resolves.toMatchObject({ done: true });
  });

  it('finds a debug session through its channel source', async () => {
    const { service, token } = makeService();
    const session = await service.createSession({
      token: await signMultiSourceDebugToken(token),
      transport: 'tcp',
      now
    });

    await expect(service.getLatestStatusBySource('debug:user:u1')).resolves.toMatchObject({
      session: expect.objectContaining({
        id: session.id
      })
    });
  });

  it('denies response envelopes without the session capability', async () => {
    const { service, token } = makeService();
    const session = await service.createSession({
      token: await signDebugToken(token),
      transport: 'tcp',
      now
    });

    await expect(
      service.publishResponse({
        sessionId: session.id,
        envelope: {
          ...makeEnvelope(session.id, session.generation),
          type: 'response',
          capability: 'admin',
          payload: {
            kind: 'plugin-debug.error',
            message: 'forbidden'
          }
        }
      })
    ).rejects.toMatchObject({
      code: 'connection_gateway.capability_denied'
    });
  });
});
