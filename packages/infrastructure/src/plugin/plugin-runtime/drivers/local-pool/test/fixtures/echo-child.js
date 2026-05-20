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
