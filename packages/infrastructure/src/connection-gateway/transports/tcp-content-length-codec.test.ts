import '@infrastructure/errors/error.registry';

import { describe, expect, it } from 'vitest';

import type { ConnectionGatewayEnvelope } from '@domain/value-objects/connection-gateway.vo';

import {
  ContentLengthJsonFrameDecoder,
  encodeContentLengthJsonFrame
} from './tcp-content-length-codec';

const envelope: ConnectionGatewayEnvelope = {
  protocol: 'connection-gateway.v1',
  sessionId: 'session-a',
  generation: 0,
  requestId: 'request-a',
  type: 'request',
  consumerType: 'plugin-debug',
  capability: 'invoke',
  createdAt: Date.now(),
  payload: { value: 1 }
};

describe('ContentLengthJsonFrameDecoder', () => {
  it('decodes split Content-Length JSON frames', () => {
    const decoder = new ContentLengthJsonFrameDecoder(1024);
    const frame = encodeContentLengthJsonFrame(envelope);
    const first = frame.subarray(0, 8);
    const second = frame.subarray(8);

    expect(decoder.push(first)).toEqual([]);
    expect(decoder.push(second)).toEqual([envelope]);
  });

  it('rejects oversized frames before reading the body', () => {
    const decoder = new ContentLengthJsonFrameDecoder(4);
    const frame = encodeContentLengthJsonFrame(envelope);

    expect(() => decoder.push(frame)).toThrow();
  });
});
