// import { FastGPTPluginClient } from '../dist/index';

import { FastGPTPluginClient } from '../src';

const client = new FastGPTPluginClient({
  baseUrl: 'http://localhost:3020',
  fetch: globalThis.fetch.bind(globalThis),
  token: 'token'
});

const result = await client.runToolStream({
  input: {},
  pluginId: 'getTime',
  systemVar: {
    time: new Date().toISOString(),
    app: {
      id: 'test-app',
      name: 'Test App'
    },
    chat: {
      chatId: 'test-chat',
      uid: 'test-user'
    },
    invokeToken: ''
  },
  version: '1.0.0',
  onMessage: (message) => {
    console.log('Received message:', message);
  },
  source: 'system'
});

console.log('Final result:', result);
