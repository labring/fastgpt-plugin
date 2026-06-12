import '@infrastructure/errors/error.registry';

import { describe, expect, it, vi } from 'vitest';

import type { ConnectionGatewayEnvelope } from '@domain/value-objects/connection-gateway.vo';

import { InMemoryConnectionGatewayMailbox, RedisConnectionGatewayMailbox } from './mailbox';

function makeEnvelope(id: string): ConnectionGatewayEnvelope {
  return {
    protocol: 'connection-gateway.v1',
    sessionId: 'session-a',
    generation: 0,
    requestId: id,
    type: 'request',
    consumerType: 'plugin-debug',
    capability: 'invoke',
    createdAt: Date.now(),
    payload: { id }
  };
}

describe('InMemoryConnectionGatewayMailbox', () => {
  it('publishes, reads, acknowledges, and trims envelopes in order', async () => {
    const mailbox = new InMemoryConnectionGatewayMailbox();
    const first = await mailbox.publish('session-a', makeEnvelope('first'));
    const second = await mailbox.publish('session-a', makeEnvelope('second'));

    await expect(mailbox.read({ sessionId: 'session-a', count: 10 })).resolves.toEqual([
      expect.objectContaining({ id: first }),
      expect.objectContaining({ id: second })
    ]);

    await mailbox.ack('session-a', [first]);
    await expect(mailbox.read({ sessionId: 'session-a', count: 10 })).resolves.toEqual([
      expect.objectContaining({ id: second })
    ]);

    await mailbox.publish('session-a', makeEnvelope('third'));
    await mailbox.trim('session-a', 1);
    await expect(mailbox.lag('session-a')).resolves.toBe(1);
  });
});

describe('RedisConnectionGatewayMailbox', () => {
  it('uses a dedicated duplicate Redis connection for blocking reads', async () => {
    const blockingRedis = makeRedisStub({
      callResult: [
        [
          'fastgpt-plugin:connection-gateway:mailbox:session-a',
          [['1-0', ['envelope', JSON.stringify(makeEnvelope('first'))]]]
        ]
      ]
    });
    const redis = makeRedisStub({
      xaddResult: '1-0',
      duplicateResult: blockingRedis
    });
    const mailbox = new RedisConnectionGatewayMailbox(redis as never, { maxLen: 100 });

    await mailbox.publish('session-a', makeEnvelope('publish'));
    await mailbox.read({ sessionId: 'session-a', blockMs: 5000, count: 1 });
    await mailbox.ack('session-a', ['1-0']);
    await mailbox.lag('session-a');
    await mailbox.disconnect();

    expect(redis.call).not.toHaveBeenCalled();
    expect(blockingRedis.call).toHaveBeenCalledWith(
      'XREAD',
      'BLOCK',
      5000,
      'COUNT',
      1,
      'STREAMS',
      'connection-gateway:mailbox:session-a',
      '0-0'
    );
    expect(redis.xadd).toHaveBeenCalledTimes(1);
    expect(redis.xdel).toHaveBeenCalledTimes(1);
    expect(redis.xlen).toHaveBeenCalledTimes(1);
    expect(blockingRedis.quit).toHaveBeenCalledTimes(1);
  });

  it('uses independent Redis connections for concurrent blocking reads', async () => {
    const firstReader = makeRedisStub({
      callResult: new Promise((resolve) => setTimeout(() => resolve(null), 10))
    });
    const secondReader = makeRedisStub({ callResult: null });
    const redis = makeRedisStub({
      duplicateResults: [firstReader, secondReader]
    });
    const mailbox = new RedisConnectionGatewayMailbox(redis as never, { maxLen: 100 });

    const firstRead = mailbox.read({ sessionId: 'session-a', blockMs: 5000, count: 1 });
    const secondRead = mailbox.read({ sessionId: 'reply:session-a:request-a', blockMs: 5000, count: 1 });

    await expect(Promise.all([firstRead, secondRead])).resolves.toEqual([[], []]);

    expect(redis.duplicate).toHaveBeenCalledTimes(2);
    expect(firstReader.call).toHaveBeenCalledTimes(1);
    expect(secondReader.call).toHaveBeenCalledTimes(1);
    expect(firstReader.quit).toHaveBeenCalledTimes(1);
    expect(secondReader.quit).toHaveBeenCalledTimes(1);
  });
});

function makeRedisStub({
  callResult = null,
  duplicateResult,
  duplicateResults,
  xaddResult = '1-0'
}: {
  callResult?: unknown;
  duplicateResult?: unknown;
  duplicateResults?: unknown[];
  xaddResult?: string;
} = {}) {
  return {
    duplicate: vi.fn(() => duplicateResults?.shift() ?? duplicateResult),
    xadd: vi.fn().mockResolvedValue(xaddResult),
    call: vi.fn().mockResolvedValue(callResult),
    xdel: vi.fn().mockResolvedValue(1),
    xtrim: vi.fn().mockResolvedValue(1),
    pexpire: vi.fn().mockResolvedValue(1),
    xlen: vi.fn().mockResolvedValue(0),
    quit: vi.fn().mockResolvedValue('OK')
  };
}
