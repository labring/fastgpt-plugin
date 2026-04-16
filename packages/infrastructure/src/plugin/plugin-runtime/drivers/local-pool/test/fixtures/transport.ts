// import { vi } from 'vitest';

import { resolve } from 'node:path';

import type { InvokePort } from '@domain/ports/invoke.port';

import { PluginPod } from '../../pod';

const fakeInvokeManager: InvokePort = {
  uploadFile: () => {}
} as unknown as InvokePort;

const pod = new PluginPod('test', {
  pluginPath: resolve(
    process.cwd(),
    'src/plugin/plugin-runtime/drivers/local-pool/test/fixtures/child.js'
  ),
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
console.log(
  await pod.invoke({
    eventName: 'run',
    payload: {
      input: 'hello'
    },
    returnStream: false
  })
);
