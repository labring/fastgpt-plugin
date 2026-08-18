import { createServer, type IncomingMessage } from 'node:http';

import {
  MemoryFCSignatureReplayStore,
  parseFCSignedRequestEnvelope,
  verifyFCRequestSignature
} from '@infrastructure/plugin/plugin-runtime/drivers/serverless/FC/fc-request-signature';
import type { FCInvokeFrame } from '@infrastructure/plugin/plugin-runtime/drivers/serverless/FC/types';

import { createArtifactDownloader } from './artifact';
import { getRuntimeId, loadFCRuntimeEnv } from './env';
import { executePluginRequest, type FCRuntimeInvokeRequest } from './handler';
import { loadPluginOnce } from './plugin-loader';

const env = loadFCRuntimeEnv();
const replayStore = new MemoryFCSignatureReplayStore();
const runtimeId = getRuntimeId(env);
const artifactDownloader = createArtifactDownloader(env);

const server = createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url?.split('?')[0] !== '/invoke') {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const transportBody = await readRequestBody(req);

  try {
    const signedRequest = hasSignatureHeaders(req)
      ? {
          body: transportBody,
          headers: req.headers as Record<string, string | undefined>
        }
      : parseFCSignedRequestEnvelope(transportBody);
    verifyFCRequestSignature({
      method: 'POST',
      path: '/invoke',
      body: signedRequest.body,
      headers: signedRequest.headers,
      secret: env.FASTGPT_INVOKE_SIGNING_SECRET,
      expectedRuntimeId: runtimeId,
      replayStore
    });

    const request = JSON.parse(signedRequest.body.toString('utf8')) as FCRuntimeInvokeRequest;
    const factory = await loadPluginOnce(env, {
      downloadArtifact: artifactDownloader
    });

    res.writeHead(200, {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-cache'
    });

    const writeFrame = (frame: FCInvokeFrame) => {
      res.write(`${JSON.stringify(frame)}\n`);
    };

    await executePluginRequest({
      env,
      factory,
      request,
      writeFrame
    });
    res.end();
  } catch (error) {
    const status = /signature|runtime id|expired|replayed/i.test(String((error as Error).message))
      ? 401
      : 500;
    res.writeHead(status, {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-cache'
    });
    res.end(
      `${JSON.stringify({
        type: 'error',
        data: {
          code: status === 401 ? 'FC_INVOKE_UNAUTHORIZED' : 'FC_HANDLER_ERROR',
          message: error instanceof Error ? error.message : 'FC runtime error'
        }
      })}\n`
    );
  }
});

server.listen(env.PORT, () => {
  console.info(`fastgpt FC plugin runtime listening on ${env.PORT}`);
});

async function readRequestBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function hasSignatureHeaders(req: IncomingMessage): boolean {
  return typeof req.headers['x-fastgpt-signature'] === 'string';
}
