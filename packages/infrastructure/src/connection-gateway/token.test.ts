import '@infrastructure/errors/error.registry';

import { describe, expect, it } from 'vitest';

import { HmacConnectionGatewayToken } from './token';

const now = 1_700_000_000_000;

describe('HmacConnectionGatewayToken', () => {
  it('signs and verifies scoped connection token claims', async () => {
    const token = new HmacConnectionGatewayToken('secret');
    const signed = await token.sign({
      consumerType: 'plugin-debug',
      subject: 'user:u1',
      sessionScope: {
        userId: 'u1',
        source: 'debug:user:u1'
      },
      transport: 'websocket',
      capabilities: ['invoke'],
      issuedAt: now,
      expiresAt: now + 60_000
    });

    await expect(
      token.verify({
        token: signed,
        expectedTransport: 'websocket',
        requiredCapability: 'invoke',
        now
      })
    ).resolves.toMatchObject({
      consumerType: 'plugin-debug',
      subject: 'user:u1',
      transport: 'websocket',
      capabilities: ['invoke']
    });
  });

  it('rejects expired, missing capability, and tampered tokens', async () => {
    const token = new HmacConnectionGatewayToken('secret');
    const signed = await token.sign({
      consumerType: 'plugin-debug',
      subject: 'user:u1',
      sessionScope: {
        userId: 'u1'
      },
      transport: 'websocket',
      capabilities: [],
      expiresAt: now - 1
    });

    await expect(token.verify({ token: signed, now })).rejects.toMatchObject({
      code: 'connection_gateway.token_expired'
    });

    const fresh = await token.sign({
      consumerType: 'plugin-debug',
      subject: 'user:u1',
      sessionScope: {
        userId: 'u1'
      },
      transport: 'websocket',
      capabilities: [],
      expiresAt: now + 60_000
    });

    await expect(
      token.verify({ token: fresh, requiredCapability: 'gateway.bind', now })
    ).rejects.toMatchObject({
      code: 'connection_gateway.capability_denied'
    });

    await expect(token.verify({ token: `${fresh}x`, now })).rejects.toMatchObject({
      code: 'connection_gateway.invalid_token'
    });
  });
});
