import {
  type ConnectionGatewayEnvelope,
  ConnectionGatewayEnvelopeSchema
} from '@domain/value-objects/connection-gateway.vo';
import { createError } from '@domain/value-objects/error.vo';

import { ErrorCode } from '../../errors/error.registry';

const HEADER_SEPARATOR = '\r\n\r\n';
const CONTENT_LENGTH_HEADER = 'content-length';

export function encodeContentLengthJsonFrame(envelope: ConnectionGatewayEnvelope): Buffer {
  const body = Buffer.from(JSON.stringify(envelope), 'utf8');
  const header = Buffer.from(`Content-Length: ${body.byteLength}${HEADER_SEPARATOR}`, 'utf8');

  return Buffer.concat([header, body]);
}

export class ContentLengthJsonFrameDecoder {
  private buffer = Buffer.alloc(0);

  constructor(private readonly maxFrameBytes: number) {}

  push(chunk: Buffer): ConnectionGatewayEnvelope[] {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    const frames: ConnectionGatewayEnvelope[] = [];

    while (true) {
      const headerEnd = this.buffer.indexOf(HEADER_SEPARATOR);
      if (headerEnd < 0) {
        return frames;
      }

      const header = this.buffer.subarray(0, headerEnd).toString('utf8');
      const contentLength = parseContentLength(header);
      if (contentLength > this.maxFrameBytes) {
        throw createError(ErrorCode.connectionGatewayEnvelopeTooLarge, {
          data: { max: this.maxFrameBytes, actual: contentLength }
        });
      }

      const bodyStart = headerEnd + Buffer.byteLength(HEADER_SEPARATOR);
      const bodyEnd = bodyStart + contentLength;
      if (this.buffer.byteLength < bodyEnd) {
        return frames;
      }

      const body = this.buffer.subarray(bodyStart, bodyEnd).toString('utf8');
      this.buffer = this.buffer.subarray(bodyEnd);
      frames.push(ConnectionGatewayEnvelopeSchema.parse(JSON.parse(body)));
    }
  }
}

function parseContentLength(header: string): number {
  const line = header
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.toLowerCase().startsWith(`${CONTENT_LENGTH_HEADER}:`));

  const value = line?.slice(line.indexOf(':') + 1).trim();
  const contentLength = Number(value);

  if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
    throw createError(ErrorCode.connectionGatewayInvalidToken, {
      message: 'Invalid Content-Length frame'
    });
  }

  return contentLength;
}
