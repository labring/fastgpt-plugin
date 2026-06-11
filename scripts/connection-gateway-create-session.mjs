#!/usr/bin/env node

import { createHmac, randomUUID } from 'node:crypto';
import net from 'node:net';

const TOKEN_HEADER = {
  alg: 'HS256',
  typ: 'CGT'
};

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  validateRequiredOptions(options);

  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const now = Date.now();
  const claims = {
    consumerType: options.consumerType,
    subject: options.subject,
    sessionScope: {
      userId: options.userId,
      ...(options.teamId ? { teamId: options.teamId } : {}),
      source: options.source
    },
    transport: options.transport,
    capabilities: options.capabilities,
    issuedAt: now,
    expiresAt: now + options.tokenTtlMs,
    nonce: randomUUID()
  };
  const connectionToken = signConnectionToken(claims, options.jwtSecret);
  const sessionPayload = await createSession({
    baseUrl,
    authToken: options.authToken,
    connectionToken,
    transport: options.transport
  });
  const session = unwrapData(sessionPayload).session;

  console.log('Session created:');
  console.log(JSON.stringify({ session, claims }, null, 2));

  if (options.tcpPing) {
    await sendTcpPing({
      host: options.tcpHost,
      port: options.tcpPort,
      session,
      capability: options.tcpCapability
    });

    const statusPayload = await getSessionStatus({
      baseUrl,
      authToken: options.authToken,
      sessionId: session.id
    });

    console.log('TCP ping sent. Session status:');
    console.log(JSON.stringify(unwrapData(statusPayload), null, 2));
  }
}

function parseArgs(args) {
  const options = {
    authToken: process.env.AUTH_TOKEN || 'token',
    baseUrl: process.env.CONNECTION_GATEWAY_BASE_URL || 'http://127.0.0.1:3010',
    capabilities: parseList(process.env.CONNECTION_GATEWAY_CAPABILITIES || 'invoke'),
    consumerType: process.env.CONNECTION_GATEWAY_CONSUMER_TYPE || 'plugin-debug',
    help: false,
    jwtSecret: process.env.JWT_SECRET || 'fastgpt-plugin-secret',
    source: process.env.CONNECTION_GATEWAY_SOURCE,
    subject: process.env.CONNECTION_GATEWAY_SUBJECT,
    tcpCapability: process.env.CONNECTION_GATEWAY_TCP_CAPABILITY || 'invoke',
    tcpHost: process.env.CONNECTION_GATEWAY_TCP_HOST || '127.0.0.1',
    tcpPing: false,
    tcpPort: Number(process.env.CONNECTION_GATEWAY_TCP_PORT || 3011),
    teamId: process.env.CONNECTION_GATEWAY_TEAM_ID,
    tokenTtlMs: Number(process.env.CONNECTION_GATEWAY_TOKEN_TTL_MS || 5 * 60_000),
    transport: process.env.CONNECTION_GATEWAY_TRANSPORT || 'tcp',
    userId: process.env.CONNECTION_GATEWAY_USER_ID || 'debug-user'
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--tcp-ping') {
      options.tcpPing = true;
      continue;
    }

    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const { key, value, nextIndex } = readLongOption(args, index);
    index = nextIndex;

    switch (key) {
      case 'auth-token':
      case 'token':
        options.authToken = value;
        break;
      case 'base-url':
      case 'baseurl':
        options.baseUrl = value;
        break;
      case 'capabilities':
        options.capabilities = parseList(value);
        break;
      case 'consumer-type':
        options.consumerType = value;
        break;
      case 'jwt-secret':
        options.jwtSecret = value;
        break;
      case 'source':
        options.source = value;
        break;
      case 'subject':
        options.subject = value;
        break;
      case 'tcp-capability':
        options.tcpCapability = value;
        break;
      case 'tcp-host':
        options.tcpHost = value;
        break;
      case 'tcp-port':
        options.tcpPort = Number(value);
        break;
      case 'team-id':
        options.teamId = value;
        break;
      case 'token-ttl-ms':
        options.tokenTtlMs = Number(value);
        break;
      case 'transport':
        options.transport = value;
        break;
      case 'user-id':
        options.userId = value;
        break;
      default:
        throw new Error(`Unknown option: --${key}`);
    }
  }

  options.subject ||= `user:${options.userId}`;
  options.source ||= `debug:user:${options.userId}`;

  return options;
}

function readLongOption(args, index) {
  const arg = args[index];
  const equalIndex = arg.indexOf('=');

  if (equalIndex > -1) {
    return {
      key: arg.slice(2, equalIndex),
      value: arg.slice(equalIndex + 1),
      nextIndex: index
    };
  }

  const value = args[index + 1];
  if (!value || value.startsWith('-')) {
    throw new Error(`Missing value for ${arg}.`);
  }

  return {
    key: arg.slice(2),
    value,
    nextIndex: index + 1
  };
}

function validateRequiredOptions(options) {
  const missing = [];

  if (!options.authToken) missing.push('auth-token');
  if (!options.baseUrl) missing.push('base-url');
  if (!options.jwtSecret) missing.push('jwt-secret');
  if (!options.subject) missing.push('subject');
  if (!options.userId) missing.push('user-id');
  if (!['tcp', 'websocket'].includes(options.transport)) missing.push('transport(tcp|websocket)');
  if (!Number.isSafeInteger(options.tokenTtlMs) || options.tokenTtlMs <= 0) {
    missing.push('token-ttl-ms');
  }
  if (options.tcpPing && (!Number.isSafeInteger(options.tcpPort) || options.tcpPort <= 0)) {
    missing.push('tcp-port');
  }

  if (missing.length > 0) {
    throw new Error(`Missing or invalid options: ${missing.join(', ')}\n\n${usageText()}`);
  }
}

function normalizeBaseUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('base-url only supports http or https.');
  }
  url.hash = '';
  url.search = '';

  return url.toString().replace(/\/+$/, '');
}

function signConnectionToken(claims, secret) {
  const header = encodeBase64Url(JSON.stringify(TOKEN_HEADER));
  const payload = encodeBase64Url(JSON.stringify(claims));
  const signature = encodeBase64Url(createHmac('sha256', secret).update(`${header}.${payload}`).digest());

  return `${header}.${payload}.${signature}`;
}

async function createSession({ baseUrl, authToken, connectionToken, transport }) {
  return postJson({
    url: `${baseUrl}/internal/sessions`,
    authToken,
    body: {
      token: connectionToken,
      transport
    }
  });
}

async function getSessionStatus({ baseUrl, authToken, sessionId }) {
  const response = await fetch(`${baseUrl}/internal/sessions/${encodeURIComponent(sessionId)}/status`, {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });

  return parseResponse(response);
}

async function postJson({ url, authToken, body }) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  return parseResponse(response);
}

async function parseResponse(response) {
  const text = await response.text();
  let payload;

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `Gateway request failed: ${response.status} ${response.statusText}\n${JSON.stringify(payload, null, 2)}`
    );
  }

  return payload;
}

async function sendTcpPing({ host, port, session, capability }) {
  const envelope = {
    protocol: 'connection-gateway.v1',
    sessionId: session.id,
    generation: session.generation,
    requestId: randomUUID(),
    type: 'request',
    consumerType: session.consumerType,
    capability,
    createdAt: Date.now(),
    payload: {
      ping: true,
      sentAt: new Date().toISOString()
    }
  };
  const body = JSON.stringify(envelope);
  const frame = `Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n${body}`;

  await new Promise((resolve, reject) => {
    const socket = net.connect(port, host, () => {
      socket.end(frame);
    });

    socket.once('close', resolve);
    socket.once('error', reject);
  });
}

function unwrapData(payload) {
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    throw new Error(`Gateway response missing data: ${JSON.stringify(payload, null, 2)}`);
  }

  return payload.data;
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function parseList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function printUsage() {
  console.log(usageText());
}

function usageText() {
  return `
Usage:
  node scripts/connection-gateway-create-session.mjs [options]

Options:
  --base-url <url>          Gateway HTTP base URL. Default: CONNECTION_GATEWAY_BASE_URL or http://127.0.0.1:3010
  --auth-token <token>      Gateway AUTH_TOKEN. Default: AUTH_TOKEN or token
  --jwt-secret <secret>     Gateway JWT_SECRET. Default: JWT_SECRET or fastgpt-plugin-secret
  --user-id <id>            sessionScope.userId. Default: CONNECTION_GATEWAY_USER_ID or debug-user
  --subject <subject>       Token subject. Default: user:<user-id>
  --source <source>         sessionScope.source. Default: debug:user:<user-id>
  --consumer-type <type>    Default: plugin-debug
  --capabilities <list>     Comma-separated capabilities. Default: invoke
  --transport <transport>   tcp or websocket. Default: tcp
  --token-ttl-ms <ms>       Connection token TTL. Default: 300000
  --tcp-ping                After creating the session, send a TCP ping envelope to the mailbox.
  --tcp-host <host>         TCP host for --tcp-ping. Default: 127.0.0.1
  --tcp-port <port>         TCP port for --tcp-ping. Default: CONNECTION_GATEWAY_TCP_PORT or 3011
`.trim();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
