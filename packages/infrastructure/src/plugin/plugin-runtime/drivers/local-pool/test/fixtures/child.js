process.send({
  messageType: 'ready'
});

console.log('hello from child');

process.on('message', (message) => {
  console.log('child received request', message);
});

// 持续阻塞
setInterval(() => {}, 10000);
