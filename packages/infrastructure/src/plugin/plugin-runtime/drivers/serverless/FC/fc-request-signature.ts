import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import { FC_SIGNATURE_TOLERANCE_MS } from './const';

export type FCSignedRequestInput = {
  method: string;
  path: string;
  timestamp: number;
  invocationId: string;
  runtimeId: string;
  body: string | Buffer;
};

export type FCRequestSignatureHeaders = {
  'x-fastgpt-runtime-id': string;
  'x-fastgpt-invocation-id': string;
  'x-fastgpt-timestamp': string;
  'x-fastgpt-body-sha256': string;
  'x-fastgpt-signature': string;
};

export type FCSignatureReplayStore = {
  has(invocationId: string, now?: number): boolean;
  add(invocationId: string, expiresAt: number): void;
};

export function sha256Hex(body: string | Buffer): string {
  return createHash('sha256').update(body).digest('hex');
}

export function signFCRequest(
  input: FCSignedRequestInput,
  secret: string
): FCRequestSignatureHeaders {
  const bodyHash = sha256Hex(input.body);
  const signature = createHmac('sha256', secret)
    .update(toSignPayload(input, bodyHash))
    .digest('hex');

  return {
    'x-fastgpt-runtime-id': input.runtimeId,
    'x-fastgpt-invocation-id': input.invocationId,
    'x-fastgpt-timestamp': String(input.timestamp),
    'x-fastgpt-body-sha256': bodyHash,
    'x-fastgpt-signature': signature
  };
}

export function verifyFCRequestSignature({
  method,
  path,
  body,
  headers,
  secret,
  expectedRuntimeId,
  now = Date.now(),
  toleranceMs = FC_SIGNATURE_TOLERANCE_MS,
  replayStore
}: {
  method: string;
  path: string;
  body: string | Buffer;
  headers: Headers | Record<string, string | undefined>;
  secret: string;
  expectedRuntimeId: string;
  now?: number;
  toleranceMs?: number;
  replayStore?: FCSignatureReplayStore;
}): { invocationId: string; runtimeId: string } {
  const runtimeId = getHeader(headers, 'x-fastgpt-runtime-id');
  const invocationId = getHeader(headers, 'x-fastgpt-invocation-id');
  const timestampText = getHeader(headers, 'x-fastgpt-timestamp');
  const bodyHash = getHeader(headers, 'x-fastgpt-body-sha256');
  const signature = getHeader(headers, 'x-fastgpt-signature');

  if (!runtimeId || !invocationId || !timestampText || !bodyHash || !signature) {
    throw new Error('Missing FC request signature headers');
  }
  if (runtimeId !== expectedRuntimeId) {
    throw new Error('Runtime id mismatch');
  }

  const timestamp = Number(timestampText);
  if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > toleranceMs) {
    throw new Error('FC request signature expired');
  }
  if (sha256Hex(body) !== bodyHash) {
    throw new Error('FC request body hash mismatch');
  }
  if (replayStore?.has(invocationId, now)) {
    throw new Error('FC request invocation replayed');
  }

  const expected = createHmac('sha256', secret)
    .update(
      toSignPayload(
        {
          method,
          path,
          timestamp,
          invocationId,
          runtimeId,
          body
        },
        bodyHash
      )
    )
    .digest('hex');

  if (!safeEqualHex(signature, expected)) {
    throw new Error('FC request signature mismatch');
  }

  replayStore?.add(invocationId, now + toleranceMs);
  return { invocationId, runtimeId };
}

export class MemoryFCSignatureReplayStore implements FCSignatureReplayStore {
  private readonly seen = new Map<string, number>();

  has(invocationId: string, now = Date.now()): boolean {
    this.prune(now);
    return this.seen.has(invocationId);
  }

  add(invocationId: string, expiresAt: number): void {
    this.prune();
    this.seen.set(invocationId, expiresAt);
  }

  private prune(now = Date.now()): void {
    for (const [invocationId, expiresAt] of this.seen) {
      if (expiresAt <= now) {
        this.seen.delete(invocationId);
      }
    }
  }
}

function toSignPayload(input: FCSignedRequestInput, bodyHash: string): string {
  return [
    input.method.toUpperCase(),
    input.path,
    String(input.timestamp),
    input.invocationId,
    input.runtimeId,
    bodyHash
  ].join('\n');
}

function getHeader(headers: Headers | Record<string, string | undefined>, name: string) {
  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }

  return headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
}

function safeEqualHex(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
