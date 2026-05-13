process.send?.({
  id: 'ready',
  messageType: 'ready',
  timestamp: Date.now()
});

process.on('message', (message) => {
  if (!message || message.messageType !== 'request') {
    return;
  }

  if (message.params?.mode === 'timeout') {
    return;
  }

  process.send?.({
    id: message.id,
    messageType: 'response',
    result: {
      method: message.method,
      params: message.params,
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
