import { fork } from 'child_process';
import { resolve } from 'path';

import { PluginRuntimeModeEnum } from '@domain/value-objects/plugin.vo';

const pluginPath = resolve(process.cwd(), 'index.js');

const p = fork(pluginPath, [], {
  stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  // execArgv: [],
  env: {
    RUNTIME_MODE: PluginRuntimeModeEnum.localPool
  }
});

console.log(p);
p.on('message', (msg) => {
  console.log(msg);
});
