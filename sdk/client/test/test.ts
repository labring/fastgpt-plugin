import { FastGPTPluginClient } from '../dist/index';

const client = new FastGPTPluginClient({
  baseUrl: 'http://localhost:3020',
  fetch: globalThis.fetch.bind(globalThis),
  token: 'token'
});

// const result = await client.listModels();
// console.log(result);
