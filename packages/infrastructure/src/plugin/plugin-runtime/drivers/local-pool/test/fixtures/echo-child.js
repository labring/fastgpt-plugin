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
        parentSecret: process.env.LOCAL_POOL_PARENT_SECRET,
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
    const handleReverseResponse = (response) => {
      if (!response || response.protocol !== '1.0' || response.id !== requestId) {
        return;
      }

      process.off('message', handleReverseResponse);
      process.send?.({
        protocol: '1.0',
        id: message.id,
        result: response.result,
        ...(message.traceId !== undefined ? { traceId: message.traceId } : {}),
        timestamp: Date.now()
      });
    };

    process.on('message', handleReverseResponse);
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
          reverseMethod === 'uploadFile'
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
