import { createHmac, timingSafeEqual } from 'node:crypto';

import type {
  ConnectionGatewayTokenSignerPort,
  ConnectionGatewayTokenVerifierPort,
  VerifyConnectionTokenInput
} from '@domain/ports/connection-gateway/connection-token.port';
import {
  type ConnectionGatewayTokenClaims,
  ConnectionGatewayTokenClaimsSchema
} from '@domain/value-objects/connection-gateway.vo';
import { createError } from '@domain/value-objects/error.vo';

import { ErrorCode } from '../errors/error.registry';

const TOKEN_HEADER = {
  alg: 'HS256',
  typ: 'CGT'
} as const;

export class HmacConnectionGatewayToken
  implements ConnectionGatewayTokenSignerPort, ConnectionGatewayTokenVerifierPort
{
  constructor(private readonly secret: string) {}

  async sign(claims: ConnectionGatewayTokenClaims): Promise<string> {
    const parsed = ConnectionGatewayTokenClaimsSchema.parse(claims);
    const header = encodeBase64Url(JSON.stringify(TOKEN_HEADER));
    const payload = encodeBase64Url(JSON.stringify(parsed));
    const signature = this.signSegments(header, payload);

    return `${header}.${payload}.${signature}`;
  }

  async verify(input: VerifyConnectionTokenInput): Promise<ConnectionGatewayTokenClaims> {
    const [header, payload, signature] = input.token.split('.');
    if (!header || !payload || !signature) {
      throw createError(ErrorCode.connectionGatewayInvalidToken);
    }

    const expectedSignature = this.signSegments(header, payload);
    if (!safeEqual(signature, expectedSignature)) {
      throw createError(ErrorCode.connectionGatewayInvalidToken);
    }

    const headerValue = parseBase64Json(header);
    if (!isRecord(headerValue) || headerValue.alg !== TOKEN_HEADER.alg || headerValue.typ !== TOKEN_HEADER.typ) {
      throw createError(ErrorCode.connectionGatewayInvalidToken);
    }

    const claims = ConnectionGatewayTokenClaimsSchema.parse(parseBase64Json(payload));
    const now = input.now ?? Date.now();

    if (claims.expiresAt <= now) {
      throw createError(ErrorCode.connectionGatewayTokenExpired);
    }

    if (input.expectedTransport && claims.transport !== input.expectedTransport) {
      throw createError(ErrorCode.connectionGatewayTransportMismatch, {
        data: {
          expectedTransport: input.expectedTransport,
          actualTransport: claims.transport
        }
      });
    }

    if (
      input.requiredCapability &&
      !claims.capabilities.includes(input.requiredCapability)
    ) {
      throw createError(ErrorCode.connectionGatewayCapabilityDenied, {
        data: {
          requiredCapability: input.requiredCapability
        }
      });
    }

    return claims;
  }

  private signSegments(header: string, payload: string): string {
    return encodeBase64Url(
      createHmac('sha256', this.secret).update(`${header}.${payload}`).digest()
    );
  }
}

function encodeBase64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

function parseBase64Json(value: string): unknown {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown;
  } catch (error) {
    throw createError(ErrorCode.connectionGatewayInvalidToken, { cause: error });
  }
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.byteLength !== rightBuffer.byteLength) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
