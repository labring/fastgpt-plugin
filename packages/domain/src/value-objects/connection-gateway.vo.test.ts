import { describe, expect, it } from 'vitest';

import { ConnectionGatewayWsClientMessageSchema } from './connection-gateway.vo';

describe('connection gateway ws client message', () => {
  it('accepts metadata updates from a bound websocket client', () => {
    expect(
      ConnectionGatewayWsClientMessageSchema.parse({
        protocol: 'connection-gateway.ws.v1',
        type: 'metadata',
        requestId: 'metadata-1',
        metadata: {
          pluginDebug: {
            targets: [
              {
                pluginId: 'getTime',
                version: '0.1.1'
              }
            ]
          }
        }
      })
    ).toMatchObject({
      type: 'metadata',
      requestId: 'metadata-1',
      metadata: {
        pluginDebug: {
          targets: [
            {
              pluginId: 'getTime'
            }
          ]
        }
      }
    });
  });
});
