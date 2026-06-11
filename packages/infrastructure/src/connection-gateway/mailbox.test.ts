import '@infrastructure/errors/error.registry';

import { describe, expect, it } from 'vitest';

import type { ConnectionGatewayEnvelope } from '@domain/value-objects/connection-gateway.vo';

import { InMemoryConnectionGatewayMailbox } from './mailbox';

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
