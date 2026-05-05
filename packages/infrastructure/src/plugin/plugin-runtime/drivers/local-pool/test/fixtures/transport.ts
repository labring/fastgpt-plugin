import { resolve } from 'node:path';

import type { InvokePort } from '@domain/ports/invoke.port';

import { PluginPod } from '../../pod';

const fakeInvokeManager: InvokePort = {
  uploadFile: () => {}
} as unknown as InvokePort;

const pluginPath = resolve(process.cwd(), 'index.js');

console.log('pluginPath', pluginPath);

const pod = new PluginPod('test', {
  pluginPath,
  getInvokeSession: () => fakeInvokeManager,
  maxConcurrentRequests: 1,
  maxRequests: 1,
  pluginPermissions: [],
  podTimeout: 10000,
  callbacks: {
    onStdout: (data) => {
      console.log(`[Plugin Pod stdout]: ${data}`);
    }
  }
});

await pod.start();
console.log(pod.getInfo(), pod.isAvailable());

console.log(
  await pod.invoke({
    eventName: 'run',
    payload: {
      input: 'hello',
      systemVar: {
        time: 'test time'
      }
    },
    returnStream: false,
    options: {}
  })
);
