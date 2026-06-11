import type Redis from 'ioredis';

import type {
  ConnectionGatewayMailboxMessage,
  ConnectionGatewayMailboxPort,
  ConnectionGatewayMailboxReadInput
} from '@domain/ports/connection-gateway/mailbox.port';
import {
  type ConnectionGatewayEnvelope,
  ConnectionGatewayEnvelopeSchema
} from '@domain/value-objects/connection-gateway.vo';

import type { InMemoryConnectionGatewayMetrics } from './metrics';

const MAILBOX_KEY_PREFIX = 'connection-gateway:mailbox';

type RedisStreamEntry = [string, string[]];
type RedisStreamResponse = Array<[string, RedisStreamEntry[]]> | null;

export class InMemoryConnectionGatewayMailbox implements ConnectionGatewayMailboxPort {
  private sequence = 0;
  private readonly streams = new Map<string, ConnectionGatewayMailboxMessage[]>();

  async publish(sessionId: string, envelope: ConnectionGatewayEnvelope): Promise<string> {
    const id = `${Date.now()}-${++this.sequence}`;
    const stream = this.getStream(sessionId);
    stream.push({ id, envelope });
    return id;
  }

  async read(input: ConnectionGatewayMailboxReadInput): Promise<ConnectionGatewayMailboxMessage[]> {
    const stream = this.getStream(input.sessionId);
    const startIndex = input.afterId
      ? stream.findIndex((message) => message.id === input.afterId) + 1
      : 0;
    const count = input.count ?? stream.length;

    return stream.slice(Math.max(0, startIndex), Math.max(0, startIndex) + count);
  }

  async ack(sessionId: string, messageIds: string[]): Promise<void> {
    const messageIdSet = new Set(messageIds);
    const stream = this.getStream(sessionId).filter((message) => !messageIdSet.has(message.id));
    this.streams.set(sessionId, stream);
  }

  async trim(sessionId: string, maxLen: number): Promise<void> {
    const stream = this.getStream(sessionId);
    if (stream.length <= maxLen) {
      return;
    }

    this.streams.set(sessionId, stream.slice(stream.length - maxLen));
  }

  async expire(sessionId: string, _ttlMs: number): Promise<void> {
    if (!this.streams.has(sessionId)) {
      return;
    }
  }

  async lag(sessionId: string): Promise<number> {
    return this.getStream(sessionId).length;
  }

  private getStream(sessionId: string): ConnectionGatewayMailboxMessage[] {
    const stream = this.streams.get(sessionId);
    if (stream) {
      return stream;
    }

    const next: ConnectionGatewayMailboxMessage[] = [];
    this.streams.set(sessionId, next);
    return next;
  }
}

export class RedisConnectionGatewayMailbox implements ConnectionGatewayMailboxPort {
  constructor(
    private readonly redis: Redis,
    private readonly options: {
      maxLen: number;
      metrics?: InMemoryConnectionGatewayMetrics;
    }
  ) {}

  async publish(sessionId: string, envelope: ConnectionGatewayEnvelope): Promise<string> {
    return this.recordRedisRoundTrip(async () => {
      const messageId = await this.redis.xadd(
        this.key(sessionId),
        'MAXLEN',
        '~',
        this.options.maxLen,
        '*',
        'envelope',
        JSON.stringify(envelope)
      );

      if (!messageId) {
        throw new Error('Redis XADD did not return a message id');
      }

      return messageId;
    });
  }

  async read(input: ConnectionGatewayMailboxReadInput): Promise<ConnectionGatewayMailboxMessage[]> {
    return this.recordRedisRoundTrip(async () => {
      const result = await this.xread(
        'BLOCK',
        input.blockMs ?? 0,
        'COUNT',
        input.count ?? 10,
        'STREAMS',
        this.key(input.sessionId),
        input.afterId ?? '0-0'
      );

      if (!result?.length) {
        return [];
      }

      return result.flatMap(([, entries]) =>
        entries.map(([id, values]) => {
          const envelopeIndex = values.findIndex((value) => value === 'envelope');
          const raw = envelopeIndex >= 0 ? values[envelopeIndex + 1] : undefined;

          return {
            id,
            envelope: ConnectionGatewayEnvelopeSchema.parse(JSON.parse(raw ?? '{}'))
          };
        })
      );
    });
  }

  async ack(sessionId: string, messageIds: string[]): Promise<void> {
    if (!messageIds.length) {
      return;
    }

    await this.recordRedisRoundTrip(async () => {
      await this.redis.xdel(this.key(sessionId), ...messageIds);
    });
  }

  async trim(sessionId: string, maxLen: number): Promise<void> {
    await this.recordRedisRoundTrip(async () => {
      await this.redis.xtrim(this.key(sessionId), 'MAXLEN', '~', maxLen);
    });
  }

  async expire(sessionId: string, ttlMs: number): Promise<void> {
    await this.recordRedisRoundTrip(async () => {
      await this.redis.pexpire(this.key(sessionId), ttlMs);
    });
  }

  async lag(sessionId: string): Promise<number> {
    return this.recordRedisRoundTrip(async () => this.redis.xlen(this.key(sessionId)));
  }

  private key(sessionId: string): string {
    return `${MAILBOX_KEY_PREFIX}:${sessionId}`;
  }

  private async xread(...args: Array<string | number>): Promise<RedisStreamResponse> {
    return this.redis.call('XREAD', ...args) as Promise<RedisStreamResponse>;
  }

  private async recordRedisRoundTrip<T>(fn: () => Promise<T>): Promise<T> {
    const startedAt = Date.now();
    try {
      return await fn();
    } finally {
      this.options.metrics?.recordRedisRoundTrip(Date.now() - startedAt);
    }
  }
}
