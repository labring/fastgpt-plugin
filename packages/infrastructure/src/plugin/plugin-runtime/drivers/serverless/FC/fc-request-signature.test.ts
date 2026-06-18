import { describe, expect, it } from 'vitest';

import {
  MemoryFCSignatureReplayStore,
  signFCRequest,
  verifyFCRequestSignature
} from './fc-request-signature';

const baseInput = {
  method: 'POST',
  path: '/invoke',
  timestamp: 1_000,
  invocationId: 'invocation-1',
  runtimeId: 'fc@getTime@1.0.0@abc',
  body: JSON.stringify({ hello: 'world' })
};

describe('FC request signature', () => {
  it('signs and verifies a request', () => {
    const headers = signFCRequest(baseInput, 'secret');

    expect(
      verifyFCRequestSignature({
        ...baseInput,
        headers,
        secret: 'secret',
        expectedRuntimeId: baseInput.runtimeId,
        now: 1_000
      })
    ).toEqual({
      invocationId: 'invocation-1',
      runtimeId: baseInput.runtimeId
    });
  });

  it('rejects body tampering', () => {
    const headers = signFCRequest(baseInput, 'secret');

    expect(() =>
      verifyFCRequestSignature({
        ...baseInput,
        body: JSON.stringify({ hello: 'changed' }),
        headers,
        secret: 'secret',
        expectedRuntimeId: baseInput.runtimeId,
        now: 1_000
      })
    ).toThrow('body hash');
  });

  it('rejects expired timestamps', () => {
    const headers = signFCRequest(baseInput, 'secret');

    expect(() =>
      verifyFCRequestSignature({
        ...baseInput,
        headers,
        secret: 'secret',
        expectedRuntimeId: baseInput.runtimeId,
        now: 1_000_000
      })
    ).toThrow('expired');
  });

  it('rejects replayed invocation ids', () => {
    const headers = signFCRequest(baseInput, 'secret');
    const replayStore = new MemoryFCSignatureReplayStore();
    const verify = () =>
      verifyFCRequestSignature({
        ...baseInput,
        headers,
        secret: 'secret',
        expectedRuntimeId: baseInput.runtimeId,
        now: 1_000,
        replayStore
      });

    verify();
    expect(verify).toThrow('replayed');
  });
});
