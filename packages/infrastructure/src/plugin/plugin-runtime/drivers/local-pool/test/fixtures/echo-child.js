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

  if (payload?.mode === 'reverse-invoke-error') {
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
    process.send?.({
      protocol: '1.0',
      id: requestId,
      method: 'client.request',
      params: {
        method: 'userInfo',
        args: {}
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
