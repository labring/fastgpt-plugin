import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

process.send?.({
  protocol: '1.0',
  method: 'client.ready',
  timestamp: Date.now()
});

process.on('message', (message) => {
  if (!message || message.protocol !== '1.0' || message.method !== 'host.request') {
    return;
  }

  const { eventName, payload } = message.params ?? {};

  if (payload?.mode === 'timeout') {
    return;
  }

  if (payload?.mode === 'stdio-chunk') {
    process.stdout.write('stdout-first\nstdout-second\n');
    process.stderr.write('stderr-first\nstderr-second\n');
  }

  if (payload?.mode === 'ignore-sigterm') {
    process.removeAllListeners('SIGTERM');
    process.on('SIGTERM', () => {});
  }

  if (payload?.mode === 'security-context') {
    let scratchWrite = 'TMPDIR_MISSING';
    if (process.env.TMPDIR) {
      try {
        writeFileSync(path.join(process.env.TMPDIR, 'allowed.txt'), 'ok');
        scratchWrite = 'ok';
      } catch (error) {
        scratchWrite = error?.code ?? 'WRITE_FAILED';
      }
    }

    let deniedReadErrorCode;
    try {
      readFileSync(payload.deniedPath, 'utf8');
    } catch (error) {
      deniedReadErrorCode = error?.code;
    }

    let childProcessErrorCode;
    try {
      execFileSync(process.execPath, ['--version']);
    } catch (error) {
      childProcessErrorCode = error?.code;
    }

    process.send?.({
      protocol: '1.0',
      id: message.id,
      result: {
        cwd: process.cwd(),
        execArgv: process.execArgv,
        home: process.env.HOME,
        tmpdir: process.env.TMPDIR,
        pluginIpcTimeoutMs: process.env.PLUGIN_IPC_TIMEOUT_MS,
        parentSecret: process.env.LOCAL_POOL_PARENT_SECRET,
        httpProxy: process.env.HTTP_PROXY,
        httpsProxy: process.env.HTTPS_PROXY,
        noProxy: process.env.NO_PROXY,
        allProxy: process.env.ALL_PROXY,
        scratchWrite,
        deniedReadErrorCode,
        childProcessErrorCode
      },
      ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
      timestamp: Date.now()
    });
    return;
  }

  if (payload?.mode === 'slow-stream') {
    const streamId = `${message.id}:output`;
    process.send?.({
      protocol: '1.0',
      method: 'channel.stream',
      params: {
        type: 'start',
        streamId,
        streamName: `request.output:${message.id}`
      },
      ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
      timestamp: Date.now()
    });
    process.send?.({
      protocol: '1.0',
      id: message.id,
      result: {
        __fastgptChannelReply__: true,
        hasOutputStream: true
      },
      ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
      timestamp: Date.now()
    });
    setTimeout(() => {
      process.send?.({
        protocol: '1.0',
        method: 'channel.stream',
        params: {
          type: 'chunk',
          streamId,
          chunk: { value: 'chunk' }
        },
        ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
        timestamp: Date.now()
      });
      process.send?.({
        protocol: '1.0',
        method: 'channel.stream',
        params: {
          type: 'end',
          streamId
        },
        ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
        timestamp: Date.now()
      });
    }, 30);
    return;
  }

  if (payload?.mode === 'reverse-invoke-error' || payload?.mode === 'reverse-invoke') {
    const reverseMethod =
      payload.mode === 'reverse-invoke-error' ? 'userInfo' : payload.reverseMethod;
    const requestId = `${message.id}:reverse`;
    let reverseResponse;
    let outputStreamId;
    let streamSettled = false;
    let streamError = null;
    const chunks = [];

    const tryFinish = () => {
      if (!reverseResponse) {
        return;
      }

      const replyEnvelope = reverseResponse.result;
      const expectsStream =
        Boolean(replyEnvelope?.__fastgptChannelReply__) && Boolean(replyEnvelope?.hasOutputStream);
      if (expectsStream && !streamSettled) {
        return;
      }

      process.off('message', handleReverseMessage);
      process.send?.({
        protocol: '1.0',
        id: message.id,
        result: expectsStream
          ? {
              meta: replyEnvelope.result,
              chunks,
              streamError
            }
          : reverseResponse.result,
        ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
        timestamp: Date.now()
      });
    };

    const handleReverseMessage = (incoming) => {
      if (!incoming || incoming.protocol !== '1.0') {
        return;
      }

      if (incoming.method === 'channel.stream' && incoming.params) {
        const frame = incoming.params;
        if (frame.type === 'start' && frame.streamName === `request.output:${requestId}`) {
          outputStreamId = frame.streamId;
          return;
        }
        if (outputStreamId && frame.streamId === outputStreamId) {
          if (frame.type === 'chunk') {
            chunks.push(
              typeof frame.chunk === 'string'
                ? frame.chunk
                : Buffer.from(frame.chunk).toString('utf8')
            );
            return;
          }
          if (frame.type === 'end') {
            streamSettled = true;
            tryFinish();
            return;
          }
          if (frame.type === 'error') {
            streamError = frame.error;
            streamSettled = true;
            tryFinish();
          }
        }
        return;
      }

      if (incoming.id === requestId) {
        reverseResponse = incoming;
        tryFinish();
      }
    };

    process.on('message', handleReverseMessage);
    if (reverseMethod === 'uploadFile') {
      const streamId = `${requestId}:input`;
      process.send?.({
        protocol: '1.0',
        method: 'channel.stream',
        params: {
          type: 'start',
          streamId,
          streamName: `request.input:${requestId}`
        }
      });
      process.send?.({
        protocol: '1.0',
        method: 'channel.stream',
        params: {
          type: 'chunk',
          streamId,
          chunk: Buffer.from('denied upload')
        }
      });
      process.send?.({
        protocol: '1.0',
        method: 'channel.stream',
        params: {
          type: 'end',
          streamId
        }
      });
    }
    process.send?.({
      protocol: '1.0',
      id: requestId,
      method: 'client.request',
      params: {
        method: reverseMethod,
        args:
          payload.reverseArgs !== undefined
            ? payload.reverseArgs
            : reverseMethod === 'uploadFile'
              ? { fileName: 'denied.txt', contentType: 'text/plain' }
              : {}
      },
      ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
      timestamp: Date.now()
    });
    return;
  }

  process.send?.({
    protocol: '1.0',
    id: message.id,
    result: {
      method: eventName,
      params: payload,
      envMode: process.env.RUNTIME_MODE
    },
    ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
    timestamp: Date.now()
  });
});

process.on('SIGTERM', () => {
  process.exit(0);
});

setInterval(() => {}, 10_000);
