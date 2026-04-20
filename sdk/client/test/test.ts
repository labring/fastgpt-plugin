import { readFileSync } from 'fs';

import { FastGPTPluginClient } from '../dist/index';

const client = new FastGPTPluginClient({
  baseUrl: 'http://localhost:3020',
  fetch: globalThis.fetch.bind(globalThis),
  token: 'token'
});

// const result = await client.listPlugins({
//   types: ['tool']
// });

const file = new File([readFileSync('./getTime.pkg')], 'getTime.pkg');

const rest = await client.uploadPlugin(file, 'test.txt', {});

console.log(rest);
